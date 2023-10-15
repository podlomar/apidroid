import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { Result } from 'monadix/result';

export interface Collection {
  filePath: string,
  lastId: number,
  items: any[],
}

export const loadCollection = async (
  fsPath: string,
): Promise<Result<Collection, 'error'>> => {
  console.log(fsPath);
  const filePath = existsSync(fsPath)
    ? path.resolve(fsPath, 'collection.json')
    : fsPath + '.json';
  
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
};

export const addToCollection = async (
  collection: Collection, item: any,
): Promise<Result<'ok', 'error'>> => {
  const newItem = { id: collection.lastId + 1, ...item };
  await fs.writeFile(
    collection.filePath,
    JSON.stringify([...collection.items, newItem], null, 2),
  );

  return Result.success('ok');
}
