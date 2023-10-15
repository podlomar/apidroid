import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { Result } from 'monadix/result';

export interface Collection {
  filePath: string,
  lastId: number,
  items: any[],
}

export type WithId<T> = T & { id: number };

export class Collections {
  private baseDir: string;

  public constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public load = async (urlPath: string): Promise<Result<Collection, 'error'>> => {
    const fsPath = path.resolve(this.baseDir, urlPath.slice(1));
    const filePath = existsSync(fsPath)
      ? path.resolve(fsPath, 'items.json')
      : fsPath + '.json';
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const items = JSON.parse(content);
      
      let lastId = -1;
      for (const item of items) {
        const numId = Number(item.id);
        if (Number.isNaN(numId)) {
          continue;
        }
    
        lastId = numId > lastId ? numId : lastId;
      }
    
      return Result.success({ filePath, lastId, items });
    } catch (error) {
      return Result.fail('error');
    }
  };

  public insert = async <T>(
    collection: Collection, item: T,
  ): Promise<Result<WithId<T>, 'error'>> => {
    const newItem = { id: collection.lastId + 1, ...item };
    await fs.writeFile(
      collection.filePath,
      JSON.stringify([...collection.items, newItem], null, 2),
    );
  
    return Result.success(newItem);
  }

  public update = async <T>(
    collection: Collection, item: WithId<T>,
  ): Promise<Result<WithId<T>, 'error'>> => {
    const items = collection.items.map((i) => i.id === item.id ? item : i);
    await fs.writeFile(
      collection.filePath,
      JSON.stringify(items, null, 2),
    );
  
    return Result.success(item);
  }

  public delete = async <T>(
    collection: Collection, id: number,
  ): Promise<Result<'ok', 'error'>> => {
    const items = collection.items.filter((item) => item.id !== id);
    await fs.writeFile(
      collection.filePath,
      JSON.stringify(items, null, 2),
    );
  
    return Result.success('ok');
  }

  private writeCollection = async (collection: Collection) => {
    await fs.writeFile(
      collection.filePath,
      JSON.stringify(collection.items, null, 2),
    );
  }
};
