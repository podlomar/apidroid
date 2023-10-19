import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import jsonpatch, { Operation } from 'fast-json-patch';
import { Collection, Collections, CollectionsOptions } from './collections.js';
import { payload } from './payload.js';
import { execQuery, parseSearchParams } from './query.js';

declare global {
  namespace Express {
    export interface Request {
      collection: Collection,
    }
  }
}

const collectionMiddleware = (collections: Collections) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const segments = req.originalUrl.split('/');
    const itemId = Number(segments.at(-1));
    
    const questionMarkIndex = req.originalUrl.indexOf('?');
    const urlPath = Number.isNaN(itemId)
      ? req.originalUrl.slice(0, questionMarkIndex === -1 ? undefined : questionMarkIndex)
      : req.originalUrl.slice(0, req.originalUrl.lastIndexOf('/'));

    (await collections.load(urlPath)).match({
      success(collection) {
        req.collection = collection;
        next();
      },
      fail(code) {
        if (code === 'invalid-type') {
          res.status(500).json(payload('server-error', [{
            code: 'invalid-type',
            message: `Collection with path ${urlPath} is not a valid collection type`,
            meta: 'The collection must be an array of objects with an id property of type number',
          }]));
          return;
        }

        if (code === 'invalid-json') {
          res.status(500).json(payload('server-error', [{
            code: 'invalid-json',
            message: `Collection with path ${urlPath} does not have a valid JSON syntax`,
          }]));
          return;
        }

        if (code === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Collection with path ${urlPath} not found`,
          }]));
          return;
        }

        if (code === 'unknown') {
          res.status(500).json(payload('server-error', [{
            code: 'error',
            message: 'Error while loading collection file',
          }]));
          return;
        }
      }
    });
  };
}

export const createServer = (options: Partial<CollectionsOptions>) => {
  const collections = new Collections(options);

  const server = express();

  server.use(cors());
  server.use('/', express.static(
    fileURLToPath(new URL('../public', import.meta.url)),
    { index: 'index.html' },
  ));
  server.use('/assets', express.static(path.resolve(collections.options.baseDir, 'assets')));
  server.use(express.json({
    limit: '10kb',
  }));

  const pathSegment = '[a-z][a-z_-]*';
  const collectionPath = `^/api(/${pathSegment})+`;
  const idPattern = '[0-9]+';

  server.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    if (error instanceof SyntaxError) {
      res.status(400).json(payload('bad-request', [{
        code: 'invalid-json',
        message: 'Invalid JSON',
      }]));
    } else {
      res.status(500).json(payload('server-error', [{
        code: 'error',
        message: 'Internal server error',
        meta: { error },
      }]));
    }
  });

  server.use(new RegExp(`${collectionPath}(/${idPattern})?$`), collectionMiddleware(collections));
  
  server.get(new RegExp(`${collectionPath}$`), async (req, res) => {
    const queryResult = parseSearchParams(
      new URLSearchParams(
        req.originalUrl.slice(req.originalUrl.indexOf('?')),
      ),
    );
    
    queryResult.match({
      success(query) {
        const items = execQuery(req.collection.items, query);
        res.json(payload('ok', items));
      },
      fail(error) {
        res.status(400).json(payload('bad-request', [error]));
      }
    });
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
        message: `Item with id ${id} not found in collection ${collection.urlPath}`,
      }]));
      return;
    }

    res.json(payload('ok', item));
  });

  server.post(new RegExp(`${collectionPath}$`), async (req, res) => {
    (await collections.insert(req.collection, req.body)).match({
      success(item) {
        res.status(201).json(payload('ok', { insertedId: item.id }));
      },
      fail(code) {
        if (code === 'max-items') {
          res.status(400).json(payload('bad-request', [{
            code: 'max-items',
            message: `Max items of ${collections.options.maxItems} reached for collection ${req.collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'error') {
          res.status(500).json(payload('server-error', [{
            code: 'error',
            message: 'Error while saving item',
          }]));
          return;
        }
      }
    });
  });

  server.put(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    (await collections.update(req.collection, { id, ...req.body })).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was updated`));
      },
      fail(code) {
        if (code === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${req.collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'error') {
          res.status(500).json(payload('server-error', [{
            code: 'error',
            message: 'Error while saving item',
          }]));
          return;
        }
      }
    });    
  });

  server.patch(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    const patch = req.body as Operation[];
    (await collections.patch(req.collection, id, patch)).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was patched`));
      },
      fail(error) {
        if (error === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${req.collection.urlPath}`,
          }]));
          return;
        }

        if (error === 'error') {
          res.status(500).json(payload('server-error', [{
            code: 'error',
            message: 'Error while saving item',
          }]));
          return;
        }

        res.status(400).json(payload('bad-request', [{
          code: 'invalid-patch',
          message: 'Invalid JSON patch',
          meta: error,
        }]));
      }
    });
  });

  server.delete(new RegExp(`${collectionPath}/${idPattern}$`), async (req, res) => {
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    (await collections.delete(req.collection, id)).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was deleted`));
      },
      fail(code) {
        if (code === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${req.collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'error') {
          res.status(500).json(payload('server-error', [{
            code: 'error',
            message: 'Error while saving item',
          }]));
          return;
        }
      }
    });
  });

  return server;
};
