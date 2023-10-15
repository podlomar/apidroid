import { createServer } from '../dist/server.js';
import supertest from 'supertest';
import { expect } from 'chai';

const request = supertest(
  createServer({
    baseDir: 'test/db01',
    maxItems: 5,
  }),
);

describe('CORS for /', () => {
  it('should allow all origins', async function() {
    const response = await request
      .options('/')
      .set('Origin', 'https://example.com')
      .expect(204);

    expect(response.headers).to.have.property('access-control-allow-origin', '*');
  });
});

describe('GET collection', () => {
  it('should return collection in a file', async function() {
    const response = await request
      .get('/api/products')
      .expect(200);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result');
    expect(response.body.result).to.deep.equal([
      { id: 0, name: 'Apples' },
      { id: 1, name: 'Oranges' },
    ]);      
  });

  it('should return collection in a folder', async function() {
    const response = await request
      .get('/api/customers')
      .expect(200);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result');
    expect(response.body.result).to.deep.equal([
      { id: 0, name: 'John Doe' },
      { id: 1, name: 'Will Smith' },
      { id: 2, name: 'Jennifer Aniston' },
      { id: 3, name: 'Brad Pitt' },
      { id: 4, name: 'Angelina Jolie' },
    ]);
  });

  it('should return 404 bad-request for non-existing collection', async function() {
    const response = await request
      .get('/api/non-existing')
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Collection with path /api/non-existing not found` },
    ]);
  });
});

describe('GET item from collection', () => {
  it('should return item from a collection', async function() {
    const response = await request
      .get('/api/products/0')
      .expect(200);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result');
    expect(response.body.result).to.deep.equal({ id: 0, name: 'Apples' });
  });

  it('should return 404 bad-request for non-existing collection', async function() {
    const response = await request
      .get('/api/non-existing/0')
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Collection with path /api/non-existing not found` },
    ]);
  });
  
  it('should return 404 bad-request for non-existing item', async function() {
    const response = await request
      .get('/api/products/2')
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Item with id 2 not found in collection /api/products` },
    ]);
  });

  it('should return 500 server-error for invalid JSON syntax', async function() {
    const response = await request
      .get('/api/nojson')
      .expect(500);

    expect(response.body).to.have.property('status').that.equals('server-error');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'invalid-json', message: 'Collection with path /api/nojson does not have a valid JSON syntax' },
    ]);
  });

  it('should return 500 server-error for invalid JSON type', async function() {
    const response = await request
      .get('/api/notarray')
      .expect(500);

    expect(response.body).to.have.property('status').that.equals('server-error');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { 
        code: 'invalid-type',
        message: 'Collection with path /api/notarray is not a valid collection type',
        meta: 'The collection must be an array of objects with an id property of type number',
      },
    ]);
  });
});

describe('POST item to collection', () => {
  it('should create item in a collection', async function() {
    const response = await request
      .post('/api/products')
      .send({ name: 'Bananas' })
      .expect(201);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result');
    expect(response.body.result).to.deep.equal({ insertedId: 2 });
  });

  it('should return 404 bad-request for non-existing collection', async function() {
    const response = await request
      .post('/api/non-existing')
      .send({ name: 'Bananas' })
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Collection with path /api/non-existing not found` },
    ]);
  });

  it('should return 400 bad-request for reaching maxItems', async function() {
    const response = await request
      .post('/api/customers')
      .send({ name: 'Leonardo DiCaprio' })
      .expect(400);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'max-items', message: `Max items of 5 reached for collection /api/customers` },
    ]);
  });
});

describe('PUT item in collection', () => {
  it('should update item in a collection', async function() {
    const response = await request
      .put('/api/products/0')
      .send({ name: 'Green Apples' })
      .expect(200);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result').that.equals('Item with id 0 was updated');
  });

  it('should return 404 bad-request for non-existing collection', async function() {
    const response = await request
      .put('/api/non-existing/0')
      .send({ name: 'Green Apples' })
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Collection with path /api/non-existing not found` },
    ]);
  });

  it('should return 404 bad-request for non-existing item', async function() {
    const response = await request
      .put('/api/customers/5')
      .send({ name: 'Leonardo DiCaprio' })
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Item with id 5 not found in collection /api/customers` },
    ]);
  });
});

describe('DELETE item from collection', () => {
  it('should delete item from a collection', async function() {
    const response = await request
      .delete('/api/products/0')
      .expect(200);

    expect(response.body).to.have.property('status').that.equals('ok');
    expect(response.body).to.have.property('result').that.equals('Item with id 0 was deleted');
  });

  it('should return 404 bad-request for non-existing collection', async function() {
    const response = await request
      .delete('/api/non-existing/0')
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Collection with path /api/non-existing not found` },
    ]);
  });

  it('should return 404 bad-request for non-existing item', async function() {
    const response = await request
      .delete('/api/customers/5')
      .expect(404);

    expect(response.body).to.have.property('status').that.equals('bad-request');
    expect(response.body).to.have.property('errors').to.deep.equal([
      { code: 'not-found', message: `Item with id 5 not found in collection /api/customers` },
    ]);
  });
});
