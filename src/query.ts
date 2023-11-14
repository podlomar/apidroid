import { Result } from "monadix/result";
import { Json, JsonObject, JsonPrimitive, isObject, isPrimitive } from "./values.js";

const numberOperators = ['lt', 'gt', 'lte', 'gte'];
const stringOperators = ['sub'];
const primitiveOperators = ['eq', 'neq'];

export type NumberOperator = typeof numberOperators[number];
export type StringOperator = typeof stringOperators[number];
export type PrimitiveOperator = typeof primitiveOperators[number];

export type Operator = NumberOperator | StringOperator | PrimitiveOperator;

export const isNumberOperator = (value: string): value is NumberOperator => {
  return numberOperators.includes(value as any);
};

export const isStringOperator = (value: string): value is StringOperator => {
  return stringOperators.includes(value as any);
};

export const isPrimitiveOperator = (value: string): value is PrimitiveOperator => {
  return primitiveOperators.includes(value as any);
};

export const isOperator = (value: string): value is Operator => {
  return isNumberOperator(value) || isStringOperator(value) || isPrimitiveOperator(value);
};

export type NumberClause = [
  path: string[],
  op: NumberOperator,
  val: number,
]

export type StringClause = [
  peth: string[],
  op: StringOperator,
  val: string,
]

export type PrimitiveClause = [
  path: string[],
  op: PrimitiveOperator,
  val: JsonPrimitive,
]

export type Clause = NumberClause | StringClause | PrimitiveClause;

export type Filter = Clause[];

export const isNumberClause = (value: Clause): value is NumberClause => {
  return isNumberOperator(value[1]);
};

export const isStringClause = (value: Clause): value is StringClause => {
  return isStringOperator(value[1]);
};

export const isPrimitiveClause = (value: Clause): value is PrimitiveClause => {
  return isPrimitiveOperator(value[1]);
};

export interface Query {
  select?: string[];
  filters?: Filter[];
  limit?: number;
  offset?: number;
}

export const execSelect = (items: JsonObject[], select: string[]): JsonObject[] => {
  return items.map((item) => {
    const result: JsonObject = {};
    for (const key of select) {
      result[key] = item[key];
    }
    return result;
  });
};

export const getValueByPath = (item: JsonObject, path: string[]): Json | undefined => {
  let value: Json | undefined = item;
  for (const key of path) {
    if (value === undefined) {
      return undefined;
    }
    
    if (!isObject(value)) {
      return undefined;
    }

    value = value[key];
  }
  
  return value;
}

export const execClause = (item: JsonObject, clause: Clause): boolean => {
  const itemValue = getValueByPath(item, clause[0]);
  if (itemValue === undefined) {
    return false;
  }
  
  if (!isPrimitive(itemValue)) {
    return false;
  }

  if (isNumberClause(clause)) {
    if (typeof itemValue !== 'number') {
      return false;
    }

    if (clause[1] === 'lt') {
      return itemValue < clause[2];
    }
    
    if (clause[1] === 'gt') {
      return itemValue > clause[2];
    }
  
    if (clause[1] === 'lte') {
      return itemValue <= clause[2];
    }
    
    if (clause[1] === 'gte') {
      return itemValue >= clause[2];
    }

    return false;
  }

  if (isStringClause(clause)) {
    if (typeof itemValue !== 'string') {
      return false;
    }

    if (clause[1] === 'sub') {
      return itemValue.includes(clause[2]);
    }

    return false;
  }

  if (isPrimitiveClause(clause)) {
    if (clause[1] === 'eq') {
      return itemValue === clause[2];
    }

    if (clause[1] === 'neq') {
      return itemValue !== clause[2];
    }

    return false;
  }

  return false;
};

export const execFilter = (item: JsonObject, filter: Filter): boolean => {
  for (const clause of filter) {
    if (!execClause(item, clause)) {
      return false;
    }
  }

  return true;
};

export const execFilters = (items: JsonObject[], filters: Filter[]): JsonObject[] => {
  return items.filter((item) => {
    for (const filter of filters) {
      if (execFilter(item, filter)) {
        return true;
      }
    }
    return false;
  });
};

export const execQuery = (items: JsonObject[], query: Query): JsonObject[] => {
  const { select, filters, limit, offset } = query;
  let result = items;
  if (filters !== undefined) {
    result = execFilters(result, filters);
  }
  if (select !== undefined) {
    result = execSelect(result, select);
  }
  if (offset !== undefined) {
    result = result.slice(offset);
  }
  if (limit !== undefined) {
    result = result.slice(0, limit);
  }

  return result;
}

export interface ParseError {
  code: string;
  message: string;
}

export const parseClause = (clauseParam: string): Result<Clause, ParseError> => {
  const [pathString, op, val] = clauseParam.split(':');
  
  if (pathString === undefined || op === undefined || val === undefined) {
    return Result.fail({
      code: 'invalid-filter-clause',
      message: `Clause ${clauseParam} is not a valid filter clause`,
    });
  }

  const path = pathString.split('.');

  if(isNumberOperator(op)) {
    const valNumber = Number(val);
    if (Number.isNaN(valNumber)) {
      return Result.fail({
        code: 'invalid-filter-value',
        message: `Value ${val} is not a valid number`,
      });
    }

    return Result.success([path, op, valNumber]);
  }

  if(isStringOperator(op)) {
    return Result.success([path, op, val]);
  }

  if(isPrimitiveOperator(op)) {
    if (val === 'true') {
      return Result.success([path, op, true]);
    }

    if (val === 'false') {
      return Result.success([path, op, false]);
    }

    if (val === 'null') {
      return Result.success([path, op, null]);
    }

    if (!Number.isNaN(Number(val))) {
      return Result.success([path, op, Number(val)]);
    }

    return Result.success([path, op, val]);
  }

  return Result.fail({
    code: 'invalid-filter-operator',
    message: `Operator ${op} is not a valid operator`,
  });
};

export const parseSearchParams = (searchParams: URLSearchParams): Result<Query, ParseError> => {
  const result: Query = {};
  if (searchParams.has('select')) {
    result.select = searchParams.getAll('select').join(',').split(',');
  }
  if (searchParams.has('limit')) {
    result.limit = Number(searchParams.get('limit'));
    if (Number.isNaN(result.limit)) {
      return Result.fail({
        code: 'invalid-limit',
        message: 'Limit must be a number',
      });
    }
  }
  if (searchParams.has('offset')) {
    result.offset = Number(searchParams.get('offset'));
    if (Number.isNaN(result.offset)) {
      return Result.fail({
        code: 'invalid-offset',
        message: 'Offset must be a number',
      });
    }
  }
  if (searchParams.has('filter')) {
    const filtersParams = searchParams.getAll('filter');
    const filters: Filter[] = [];
    
    for (const filterParam of filtersParams) {
      const clauseParams = filterParam.split(',');
      const filter: Filter = [];
      
      for (const clauseParam of clauseParams) {
        const clauseResult = parseClause(clauseParam);
        if (clauseResult.isFail()) {
          return clauseResult;
        }

        filter.push(clauseResult.get());
      }

      filters.push(filter);
    }
    
    result.filters = filters;
  }
  
  return Result.success(result);
};
