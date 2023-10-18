import { execQuery } from '../dist/query.js';
import { expect } from 'chai';

describe('Querying data', () => {
  const items = [
    { id: 1, name: 'John', age: 25 },
    { id: 2, name: 'Jane', age: 30 },
    { id: 3, name: 'Bob', age: 35 },
    { id: 4, name: 'Alice', age: 40 },
  ];

  it('should return all items when no query is provided', () => {
    const result = execQuery(items, {});
    expect(result).to.deep.equal(items);
  });

  it('should return only selected fields when select is provided', () => {
    const result = execQuery(items, { select: ['name', 'age'] });
    expect(result).to.deep.equal([
      { name: 'John', age: 25 },
      { name: 'Jane', age: 30 },
      { name: 'Bob', age: 35 },
      { name: 'Alice', age: 40 },
    ]);
  });

  it('should filter items based on filter clauses', () => {
    const result = execQuery(items, {
      filters: [
        [
          ['age', 'gt', 30],
          ['age', 'lte', 40],
          ['name', 'sub', 'e'],
        ],
      ],
    });
    expect(result).to.deep.equal([
      { id: 4, name: 'Alice', age: 40 },
    ]);
  });

  it('should limit the number of items returned', () => {
    const result = execQuery(items, { limit: 2 });
    expect(result).to.deep.equal([
      { id: 1, name: 'John', age: 25 },
      { id: 2, name: 'Jane', age: 30 },
    ]);
  });

  it('should offset the items returned', () => {
    const result = execQuery(items, { offset: 2 });
    expect(result).to.deep.equal([
      { id: 3, name: 'Bob', age: 35 },
      { id: 4, name: 'Alice', age: 40 },
    ]);
  });

  it('should apply all query options in the correct order', () => {
    const result = execQuery(items, {
      select: ['name', 'age'],
      filters: [[['age', 'gt', 30]]],
      limit: 1,
      offset: 1,
    });
    expect(result).to.deep.equal([
      { name: 'Alice', age: 40 },
    ]);
  });
});
