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
