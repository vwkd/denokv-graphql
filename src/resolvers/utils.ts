import {
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../deps.ts";
import type { GraphQLField, GraphQLType } from "../../deps.ts";
import { InvalidInput } from "../utils.ts";

/**
 * Test if two types have the same wrapping types
 *
 * e.g. `[T!]!` and `[S!]!`, but not `[T]! and `[S]`
 * @param type1 first type
 * @param type2 second type
 */
export function isSameWrapping(
  type1: GraphQLType,
  type2: GraphQLType,
): boolean {
  let innerType1 = type1;
  let innerType2 = type2;

  if (isNonNullType(innerType1) && isNonNullType(innerType2)) {
    innerType1 = innerType1.ofType;
    innerType2 = innerType2.ofType;
  }

  if (isListType(innerType1) && isListType(innerType2)) {
    innerType1 = innerType1.ofType;
    innerType2 = innerType2.ofType;
  }

  if (isNonNullType(innerType1) && isNonNullType(innerType2)) {
    innerType1 = innerType1.ofType;
    innerType2 = innerType2.ofType;
  }

  if (
    isNonNullType(innerType1) || isListType(innerType1) ||
    isNonNullType(innerType2) ||
    isListType(innerType2)
  ) {
    return false;
  }

  return true;
}

/**
 * Test if type including wrapped in list or non-null
 *
 * - T
 * - T!
 * - [T]
 * - [T!]
 * - [T]!
 * - [T!]!
 * @param type column type
 * @param testFn test function for wrapped type
 */
export function isType<T extends GraphQLType>(
  type: unknown,
  testFn: (t: unknown) => t is T,
): boolean {
  let innerType = type;

  if (isNonNullType(type)) {
    innerType = type.ofType;
  }

  if (isListType(innerType)) {
    innerType = innerType.ofType;
  }

  if (isNonNullType(innerType)) {
    innerType = innerType.ofType;
  }

  if (testFn(innerType)) {
    return true;
  }

  return false;
}

/**
 * Test if field is a `id: ID!` field
 * @param field field
 * @returns boolean
 */
export function isIdField(field: GraphQLField<any, any>): boolean {
  return field.name == "id" && isNonNullType(field.type) &&
    isScalarType(field.type.ofType) && field.type.ofType.name == "ID";
}

/**
 * Test if field is a reference field
 * @param type field type
 * @returns boolean
 */
export function isReferenceField(field: GraphQLField<any, any>): boolean {
  if (isType(field.type, isObjectType)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Parse a string id into a bigint id
 * @param str string id
 * @param tableName table name
 */
export function parseId(str: string, tableName: string): bigint {
  let id: bigint;

  try {
    id = BigInt(str);
  } catch (e) {
    throw new InvalidInput(
      `Expected table '${tableName}' argument 'id' to contain bigint as string`,
    );
  }

  if (id <= 0n) {
    throw new InvalidInput(
      `Expected table '${tableName}' argument 'id' to contain positive bigint as string`,
    );
  }

  return id;
}

/**
 * Parse one or more string ids into bigint ids
 * @param strs string id or array of string ids
 * @param tableName table name
 * @param columnName column name
 */
export function parseIds(
  strs: string | string[],
  tableName: string,
  columnName: string,
): bigint | bigint[] {
  if (!Array.isArray(strs)) {
    let id: bigint;

    try {
      id = BigInt(strs);
    } catch (e) {
      throw new InvalidInput(
        `Expected input table '${tableName}' column '${columnName}' to contain bigint as string`,
      );
    }

    if (id <= 0n) {
      throw new InvalidInput(
        `Expected input table '${tableName}' column '${columnName}' to contain positive bigint as string`,
      );
    }

    return id;
  } else {
    let ids: bigint[] = [];

    for (const str of strs) {
      let id: bigint;

      try {
        id = BigInt(str);
      } catch (e) {
        throw new InvalidInput(
          `Expected input table '${tableName}' column '${columnName}' to contain array of bigints as strings`,
        );
      }

      if (id <= 0n) {
        throw new InvalidInput(
          `Expected input table '${tableName}' column '${columnName}' to contain array of positive bigints as strings`,
        );
      }

      ids.push(id);
    }

    return ids;
  }
}
