import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { Result } from 'monadix/result';
import jsonpatch, { JsonPatchError, Operation } from 'fast-json-patch';
import { JsonObject } from './values.js';
import { Query, execQuery } from './query.js';

export type CollectionItem = JsonObject & { id: number };

export interface CollectionOptions {
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

export class Collection {
  public readonly filePath: string;
  public readonly urlPath: string;
  public readonly maxItems: number;

  private lastId: number;
  private items: CollectionItem[];
  
  public constructor(
    filePath: string,
    urlPath: string,
    lastId: number,
    maxItems: number,
    items: CollectionItem[],
  ) {
    this.filePath = filePath;
    this.urlPath = urlPath;
    this.lastId = lastId;
    this.maxItems = maxItems;
    this.items = items;
  }

  public static async load (
    urlPath: string, options: CollectionOptions,
  ): Promise<Result<Collection, 'invalid-type' | 'invalid-json' | 'not-found' | 'unknown'>> {
    const fsPath = path.resolve(options.baseDir, urlPath.slice(1));
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
    
      return Result.success(new Collection(
        filePath, urlPath, lastId, options.maxItems ?? 1000, items,
      ));
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

  public async insert <T extends JsonObject>(
    item: T,
  ): Promise<Result<CollectionItem, 'extra-id' | 'max-items' | 'store-error'>> {
    if ('id' in item) {
      return Result.fail('extra-id');
    }

    if (this.items.length >= this.maxItems) {
      return Result.fail('max-items');
    }

    this.lastId += 1;
    const newItem = { id: this.lastId, ...item };    
    this.items.push(newItem);

    try {
      await this.store();
    } catch (error) {
      return Result.fail('store-error');
    }
  
    return Result.success(newItem);
  }

  public async update <T extends JsonObject>(
    id: number, item: JsonObject,
  ): Promise<Result<'ok', 'extra-id' | 'not-found' | 'store-error'>> {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return Result.fail('not-found');
    }
    
    return this.updateAndStore(() => {
      this.items[itemIndex] = { ...item, id };
    });
  }

  public async patch (
    id: number, patch: Operation[],
  ): Promise<Result<'ok', 'not-found' | 'store-error' | JsonPatchError>> {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return Result.fail('not-found');
    }

    const item = this.items[itemIndex];
    const error = jsonpatch.validate(patch, item);
    if (error !== undefined) {
      return Result.fail(error);
    }

    return this.updateAndStore(() => {
      // TODO: You should not be able to change the id
      this.items[itemIndex] = jsonpatch.applyPatch(item, patch).newDocument;
    });
  }

  public async delete (
    id: number,
  ): Promise<Result<'ok', 'not-found' | 'store-error'>> {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return Result.fail('not-found');
    }

    return this.updateAndStore(() => {
      this.items.splice(itemIndex, 1);
    });
  }

  public query (query: Query): JsonObject[] {
    return execQuery(this.items, query);
  }

  public find(id: number): CollectionItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  private async updateAndStore(updateFn: () => void): Promise<Result<'ok', 'store-error'>> {
    updateFn();
    try {
      await this.store();
    } catch (error) {
      return Result.fail('store-error');
    }
  
    return Result.success('ok');
  }

  private async store(): Promise<void> {
    return fs.writeFile(
      this.filePath,
      `${JSON.stringify(this.items, null, 2)}\n`,
    );
  }
};
