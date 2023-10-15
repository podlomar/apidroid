import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { Result } from 'monadix/result';

export interface Collection {
  filePath: string,
  urlPath: string,
  lastId: number,
  items: any[],
}

export type WithId<T> = T & { id: number };

export interface CollectionsOptions {
  readonly baseDir: string,
  readonly maxItems: number,
}

const checkFormat = (data: any): boolean => {
  if (!Array.isArray(data)) {
    return false;
  }

  for (const item of data) {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
  }

  return true;
};

export class Collections {
  public options: CollectionsOptions;

  public constructor(options: Partial<CollectionsOptions>) {
    this.options = {
      baseDir: options.baseDir ?? process.cwd(),
      maxItems: options.maxItems ?? 1000,
    };
  }

  public load = async (
    urlPath: string,
  ): Promise<Result<Collection, 'invalid-type' | 'invalid-json' | 'not-found' | 'unknown'>> => {
    const fsPath = path.resolve(this.options.baseDir, urlPath.slice(1));
    const filePath = existsSync(fsPath)
      ? path.resolve(fsPath, 'items.json')
      : fsPath + '.json';
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const items = JSON.parse(content);
      if (!checkFormat(items)) {
        return Result.fail('invalid-type');
      }

      let lastId = -1;
      for (const item of items) {
        const numId = Number(item.id);
        if (Number.isNaN(numId)) {
          continue;
        }
    
        lastId = numId > lastId ? numId : lastId;
      }
    
      return Result.success({ filePath, urlPath, lastId, items });
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        return Result.fail('invalid-json');
      }

      if (error.code === 'ENOENT') {
        return Result.fail('not-found');
      }

      return Result.fail('unknown');
    }
  };

  public insert = async <T>(
    collection: Collection, item: T,
  ): Promise<Result<WithId<T>, 'max-items' | 'error'>> => {
    if (collection.items.length >= this.options.maxItems) {
      return Result.fail('max-items');
    }

    const newItem = { id: collection.lastId + 1, ...item };
    collection.items.push(newItem);

    try {
      await this.writeCollection(collection);
    } catch (error) {
      return Result.fail('error');
    }
  
    return Result.success(newItem);
  }

  public update = async <T>(
    collection: Collection, item: WithId<T>,
  ): Promise<Result<'ok', 'not-found' | 'error'>> => {
    const itemIndex = collection.items.findIndex((i) => i.id === item.id);
    if (itemIndex === -1) {
      return Result.fail('not-found');
    }
    
    collection.items[itemIndex] = item;

    try {
      await this.writeCollection(collection);
    } catch (error) {
      return Result.fail('error');
    }
  
    return Result.success('ok');
  }

  public delete = async <T>(
    collection: Collection, id: number,
  ): Promise<Result<'ok', 'not-found' | 'error'>> => {
    const itemIndex = collection.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return Result.fail('not-found');
    }

    collection.items.splice(itemIndex, 1);
    
    try {
      await this.writeCollection(collection);
    } catch (error) {
      return Result.fail('error');
    }
  
    return Result.success('ok');
  }

  private writeCollection = (collection: Collection) => {
    return fs.writeFile(
      collection.filePath,
      `${JSON.stringify(collection.items, null, 2)}\n`,
    );
  }
};
