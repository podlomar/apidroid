import path from 'path';
import express from 'express';
import { addToCollection, loadCollection, removeFromCollection, updateInCollection } from './collections.js';
import { payload } from './payload.js';

const baseDir = process.argv[2] ?? process.cwd();

const app = express();

app.use('/assets', express.static(path.resolve(baseDir, 'assets')));
app.use(express.json());

const pathSegment = '[a-z][a-z_-]*';
const collectionPath = `^/api(/${pathSegment})+`;
const idPattern = '[0-9]+';

app.get(new RegExp(`${collectionPath}$`), async (req, res) => {
  const fsPath = path.resolve(baseDir, req.path.slice(1));
  const collectionResult = await loadCollection(fsPath);
  if (collectionResult.isFail()) {
    res.status(404).send('Not found');
    return;
  };

  const collection = collectionResult.get();
  res.json(payload('ok', collection.items));
});

app.get(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
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

app.post(new RegExp(`${collectionPath}$`), async (req, res) => {
  const fsPath = path.resolve(baseDir, req.path.slice(1));
  const collectionResult = await loadCollection(fsPath);
  if (collectionResult.isFail()) {
    res.status(404).send('Not found');
    return;
  };

  const collection = collectionResult.get();
  const body = req.body;

  const newItem = await addToCollection(collection, body);
  if (newItem.isFail()) {
    res.status(500).json(payload('server-error', [{
      code: 'error',
      message: 'Error while saving item',
    }]));
    return;
  }

  res.status(201).json(payload('ok', { id: newItem.get().id }));
});

app.put(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
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
  const result = await updateInCollection(collection, { ...req.body, id });
  if (result.isFail()) {
    res.status(500).json(payload('server-error', [{
      code: 'error',
      message: 'Error while saving item',
    }]));
    return;
  }

  res.json(payload('ok', result.get()));
});

app.delete(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
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
  const result = await removeFromCollection(collection, id);
  if (result.isFail()) {
    res.status(500).json(payload('server-error', [{
      code: 'error',
      message: 'Error while saving item',
    }]));
    return;
  }

  res.json(payload('ok', `Item with id ${id} was deleted`));
});

app.listen(4000, () => {
  console.log('Server běží na portu 4000');
});
