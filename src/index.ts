import path from 'path';
import express from 'express';
import { loadCollection } from './collections.js';
import { payload } from './payload.js';

const baseDir = process.argv[2] ?? process.cwd();

const app = express();

app.use('/assets', express.static(path.resolve(baseDir, 'assets')));

const pathSegment = '[a-z][a-z_\-]*';
const colletionPath = `^/api(/${pathSegment})+`;
const idPattern = '[0-9]+';

app.get(new RegExp(`${colletionPath}$`), async (req, res) => {
  const fsPath = path.resolve(baseDir, req.path.slice(1));
  const collectionResult = await loadCollection(fsPath);
  if (collectionResult.isFail()) {
    res.status(404).send('Not found');
    return;
  };

  const collection = collectionResult.get();
  res.json(payload('ok', collection.items));
});

app.get(new RegExp(`${colletionPath}/${idPattern}$`), async (req, res) => {
  const fsPath = path.resolve(
    baseDir, req.path.slice(1, req.path.lastIndexOf('/')),
  );
  const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1))

  const collectionResult = await loadCollection(fsPath);
  if (collectionResult.isFail()) {
    res.status(404).send('Not found');
    return;
  };

  const collection = collectionResult.get();
  const item = collection.items.find((item: any) => item.id === id);
  if (item === undefined) {
    res.status(404).json(payload('bad-request', [{
      code: 'not-found',
      message: `Item with id ${id} not found`,
    }]));
    return;
  }

  res.json(payload('ok', item));
});

app.listen(4000, () => {
  console.log('Server běží na portu 4000');
});
