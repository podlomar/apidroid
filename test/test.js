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
});

