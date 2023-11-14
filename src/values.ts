export type JsonPrimitive = number | string | boolean | null;
export type JsonObject = { [key: string]: Json };
export type JsonArray = Json[];
export type Json = JsonPrimitive | JsonObject | JsonArray;

export const isPrimitive = (value: Json): value is JsonPrimitive => {
  return (
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === null
  );
};

export const isArray = (value: Json): value is JsonArray => {
  return Array.isArray(value);
};

export const isObject = (value: Json): value is JsonObject => {
  return !isPrimitive(value) && !isArray(value);
};
