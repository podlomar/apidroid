import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { dirname } from './dirname.js';
import { Operation } from 'fast-json-patch';
import { Collection, CollectionOptions } from './collection.js';
import { payload } from './payload.js';
import { parseSearchParams } from './query.js';
import { discover } from './discover.js';

declare global {
  namespace Express {
    export interface Request {
      collection: Collection,
    }
  }
}

export interface ServerOptions {
  readonly serverUrl: string,
  readonly version: string,
  readonly collections?: Partial<CollectionOptions>,
}

const collectionMiddleware = (options: CollectionOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const segments = req.originalUrl.split('/');
    const itemId = Number(segments.at(-1));
    
    const questionMarkIndex = req.originalUrl.indexOf('?');
    const urlPath = Number.isNaN(itemId)
      ? req.originalUrl.slice(0, questionMarkIndex === -1 ? undefined : questionMarkIndex)
      : req.originalUrl.slice(0, req.originalUrl.lastIndexOf('/'));

    (await Collection.load(urlPath, options)).match({
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

export const createServer = (options: ServerOptions) => {
  const server = express();
  
  const collectionOptions: CollectionOptions = {
    baseDir: options.collections?.baseDir ?? process.cwd(),
    maxItems: options.collections?.maxItems ?? 1000,
  };

  server.use(cors());
  server.use('/', express.static(dirname('public'), { index: 'index.html' }));
  server.use('/assets', express.static(path.resolve(collectionOptions.baseDir, 'assets')));
  server.use(express.json({
    limit: '10kb',
  }));

  const collectionPath = `^/api/[a-z][a-z_-]*`;
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

  server.use(new RegExp(`${collectionPath}(/${idPattern})?$`), collectionMiddleware(collectionOptions));
  
  server.get('/api', async (req, res) => {
    const entries = discover(collectionOptions.baseDir);
    res.json(payload('ok', {
      message: `This API is powered by jsonhost v${options.version}`,
      collections: entries.map(entry => ({
        url: `${options.serverUrl}/${entry.urlPath}`,
      })),
    }));
  });

  server.get(new RegExp(`${collectionPath}$`), async (req, res) => {
    const queryResult = parseSearchParams(
      new URLSearchParams(
        req.originalUrl.slice(req.originalUrl.indexOf('?')),
      ),
    );
    
    queryResult.match({
      success(query) {
        const items = req.collection.query(query);
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

    const collectionResult = await Collection.load(urlPath, collectionOptions);
    if (collectionResult.isFail()) {
      res.status(404).json(payload('bad-request', [{
        code: 'not-found',
        message: `Collection with path ${urlPath} not found`,
      }]));
      return;
    };

    const collection = collectionResult.get();
    const item = collection.find(id);
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
    const collection = req.collection;
    (await collection.insert(req.body)).match({
      success(item) {
        res.status(201).json(payload('ok', { insertedId: item.id }));
      },
      fail(code) {
        if (code === 'max-items') {
          res.status(400).json(payload('bad-request', [{
            code: 'max-items',
            message: `Max items of ${collection.maxItems} reached for collection ${collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'store-error') {
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
    const collection = req.collection;
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    (await collection.update(id, { ...req.body })).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was updated`));
      },
      fail(code) {
        if (code === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'store-error') {
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
    const collection = req.collection;
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    const patch = req.body as Operation[];
    (await collection.patch(id, patch)).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was patched`));
      },
      fail(error) {
        if (error === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${collection.urlPath}`,
          }]));
          return;
        }

        if (error === 'store-error') {
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
    const collection = req.collection;
    const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
    (await collection.delete(id)).match({
      success() {
        res.json(payload('ok', `Item with id ${id} was deleted`));
      },
      fail(code) {
        if (code === 'not-found') {
          res.status(404).json(payload('bad-request', [{
            code: 'not-found',
            message: `Item with id ${id} not found in collection ${collection.urlPath}`,
          }]));
          return;
        }

        if (code === 'store-error') {
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
