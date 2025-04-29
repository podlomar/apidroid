import path from 'path';
import { existsSync } from 'fs';
import { walkSync } from '@nodelib/fs.walk';

export const fileCollectionRegex = /api\/[a-z][a-z_-]*\.json/;
export const directoryCollectionRegex = /api\/[a-z][a-z_-]*\/items\.json/;

export interface CollectionEntry {
  path: string;
  urlPath: string;
}

export const discover = (baseDir: string): CollectionEntry[] => {
  const apiDir = path.join(baseDir, 'api');
  if (!existsSync(apiDir)) {
    return [];
  }
  
  const entries = walkSync(path.join(baseDir, 'api'));

  const result: CollectionEntry[] = [];
  for (const entry of entries) {
    const relativePath = path.relative(baseDir, entry.path).replace(/\\/g, '/');
    if (fileCollectionRegex.test(relativePath)) {
      const urlPath = relativePath.slice(0, relativePath.lastIndexOf('.'));
      result.push({
        path: entry.path,
        urlPath,
      });
    } else if (directoryCollectionRegex.test(relativePath)) {
      const urlPath = relativePath.slice(0, relativePath.lastIndexOf('/'));
      result.push({
        path: entry.path,
        urlPath,
      });
    }
  }

  return result;
};
