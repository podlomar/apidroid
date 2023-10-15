import path from 'path';
import express from 'express';
import cors from 'cors';
import { Collections } from './collections.js';
import { payload } from './payload.js';

export const createServer = (baseDir: string) => {
  const collections = new Collections(baseDir);

  const server = express();

  server.use(cors());
  server.use('/assets', express.static(path.resolve(baseDir, 'assets')));
  server.use(express.json());

  const pathSegment = '[a-z][a-z_-]*';
  const collectionPath = `^/api(/${pathSegment})+`;
  const idPattern = '[0-9]+';

  server.get(new RegExp(`${collectionPath}$`), async (req, res) => {
    const collectionResult = await collections.load(req.path);
    if (collectionResult.isFail()) {
      res.status(404).json(payload('bad-request', [{
        code: 'not-found',
        message: `Collection with path ${req.path} not found`,
      }]));
      return;
    };

    const collection = collectionResult.get();
    res.json(payload('ok', collection.items));
  });

  server.get(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const urlPath = req.path.slice(0, req.path.lastIndexOf('/'));
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1))

    const collectionResult = await collections.load(urlPath);
    if (collectionResult.isFail()) {
      res.status(404).json(payload('bad-request', [{
        code: 'not-found',
        message: `Collection with path ${urlPath} not found`,
      }]));
      return;
    };

    const collection = collectionResult.get();
    const item = collection.items.find((item: any) => item.id === id);
    if (item === undefined) {
      res.status(404).json(payload('bad-request', [{
        code: 'not-found',
        message: `Item with id ${id} not found in collection ${urlPath}`,
      }]));
      return;
    }

    res.json(payload('ok', item));
  });

  server.post(new RegExp(`${collectionPath}$`), async (req, res) => {
    const collectionResult = await collections.load(req.path);
    if (collectionResult.isFail()) {
      res.status(404).send('Not found');
      return;
    };

    const collection = collectionResult.get();
    const body = req.body;

    const newItem = await collections.insert(collection, body);
    if (newItem.isFail()) {
      res.status(500).json(payload('server-error', [{
        code: 'error',
        message: 'Error while saving item',
      }]));
      return;
    }

    res.status(201).json(payload('ok', { id: newItem.get().id }));
  });

  server.put(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const fsPath = path.resolve(
      baseDir, req.path.slice(0, req.path.lastIndexOf('/')),
    );
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1))

    const collectionResult = await collections.load(fsPath);
    if (collectionResult.isFail()) {
      res.status(404).send('Not found');
      return;
    };

    const collection = collectionResult.get();
    const result = await collections.update(collection, { id, ...req.body });
    if (result.isFail()) {
      res.status(500).json(payload('server-error', [{
        code: 'error',
        message: 'Error while saving item',
      }]));
      return;
    }

    res.json(payload('ok', result.get()));
  });

  server.delete(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const fsPath = path.resolve(
      baseDir, req.path.slice(0, req.path.lastIndexOf('/')),
    );
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1))

    const collectionResult = await collections.load(fsPath);
    if (collectionResult.isFail()) {
      res.status(404).send('Not found');
      return;
    };

    const collection = collectionResult.get();
    const result = await collections.delete(collection, id);
    if (result.isFail()) {
      res.status(500).json(payload('server-error', [{
        code: 'error',
        message: 'Error while saving item',
      }]));
      return;
    }

    res.json(payload('ok', `Item with id ${id} was deleted`));
  });

  return server;
};
