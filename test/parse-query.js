import { parseSearchParams } from '../dist/query.js';
import { expect } from 'chai';

describe('Parse search params', () => {
  it('should parse select parameter', () => {
    const searchParams = new URLSearchParams('select=name,age');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      select: ['name', 'age'],
    });
  });

  it('should parse limit parameter', () => {
    const searchParams = new URLSearchParams('limit=10');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      limit: 10,
    });
  });

  it('should fail to parse invalid limit parameter', () => {
    const searchParams = new URLSearchParams('limit=abc');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.false;
    expect(result.err()).to.deep.equal({
      code: 'invalid-limit',
      message: 'Limit must be a number',
    });
  });

  it('should parse offset parameter', () => {
    const searchParams = new URLSearchParams('offset=20');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      offset: 20,
    });
  });

  it('should fail to parse invalid offset parameter', () => {
    const searchParams = new URLSearchParams('offset=xyz');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.false;
    expect(result.err()).to.deep.equal({
      code: 'invalid-offset',
      message: 'Offset must be a number',
    });
  });

  it('should parse filter clause parameter', () => {
    const searchParams = new URLSearchParams('filter=age:gt:20,age:lt:30');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      filters: [
        [
          ['age', 'gt', 20],
          ['age', 'lt', 30]
        ],
      ],
    });
  });

  it('should parse filter parameter', () => {
    const searchParams = new URLSearchParams('filter=name:eq:John,age:gt:30');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      filters: [
        [
          ['name', 'eq', 'John'],
          ['age', 'gt', 30],
        ],
      ],
    });
  });

  it('should parse multiple filters', () => {
    const searchParams = new URLSearchParams('filter=name:eq:John&filter=age:gt:30');
    const result = parseSearchParams(searchParams);
    expect(result.isSuccess()).to.be.true;
    expect(result.get()).to.deep.equal({
      filters: [
        [
          ['name', 'eq', 'John'],
        ],
        [
          ['age', 'gt', 30],
        ],
      ],
    });
  });

  it('should fail to parse invalid filter parameter', () => {
    const searchParams = new URLSearchParams('filter=name:John');
    const result = parseSearchParams(searchParams);
    expect(result.isFail()).to.be.true;
    expect(result.err()).to.deep.equal({
      code: 'invalid-filter-clause',
      message: 'Clause name:John is not a valid filter clause',
    });
  });

  it('should fail to parse invalid filter operator', () => {
    const searchParams = new URLSearchParams('filter=name:invalid:John');
    const result = parseSearchParams(searchParams);
    expect(result.isFail()).to.be.true;
    expect(result.err()).to.deep.equal({
      code: 'invalid-filter-operator',
      message: 'Operator invalid is not a valid operator',
    });
  });
});
