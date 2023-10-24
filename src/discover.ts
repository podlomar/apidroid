import path from 'path';
import { walkSync } from '@nodelib/fs.walk';

export const fileCollectionRegex = /api\/[a-z][a-z_-]*\.json/;
export const directoryCollectionRegex = /api\/[a-z][a-z_-]*\/items\.json/;

export interface CollectionEntry {
  path: string;
  urlPath: string;
}

export const discover = (baseDir: string): CollectionEntry[] => {
  const entries = walkSync(path.join(baseDir, 'api'));

  const result: CollectionEntry[] = [];
  for (const entry of entries) {
    const relativePath = path.relative(baseDir, entry.path);

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
