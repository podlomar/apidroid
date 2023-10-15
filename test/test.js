import { createServer } from '../dist/server.js';
import supertest from 'supertest';
import { expect } from 'chai';

const request = supertest(
  createServer('test/db01'),
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
});

