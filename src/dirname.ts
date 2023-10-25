import path from 'path';
import { fileURLToPath } from 'url';

export const dirname = (filePath: string): string => {
  return fileURLToPath(new URL(path.join('..', filePath), import.meta.url));
};
