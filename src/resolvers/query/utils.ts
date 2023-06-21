import {
  isLeafType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLObjectType,
  GraphQLOutputType,
} from "../../../deps.ts";
import { DatabaseCorruption, InvalidSchema, isObject } from "../../utils.ts";
import { isIdField, isType } from "../utils.ts";

/**
 * Validate query return value
 *
 * - nullable object type
 * - has fields of `Result` and additional `value` field of non-null object type
 * @param type return value
 * @param queryName query name
 */
export function validateQueryReturn(
  value: GraphQLOutputType,
  queryName: string,
): asserts value is GraphQLObjectType {
  if (!(isObjectType(value))) {
    throw new InvalidSchema(
      `Query '${queryName}' must return nullable object type`,
    );
  }

  const fields = value.getFields();

  if (
    !(Object.keys(fields).length == 3)
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' return type must have three fields`,
    );
  }

  if (
    !(fields["id"] &&
      isNonNullType(fields["id"].type) &&
      isScalarType(fields["id"].type.ofType) &&
      fields["id"].type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' return type must have field 'id' with non-null 'ID' type`,
    );
  }

  if (
    !(fields["versionstamp"] &&
      isNonNullType(fields["versionstamp"].type) &&
      isScalarType(fields["versionstamp"].type.ofType) &&
      fields["versionstamp"].type.ofType.name == "String")
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' return type must have field 'versionstamp' with non-null 'String' type`,
    );
  }

  if (
    !(fields["value"] &&
      isNonNullType(fields["value"].type) &&
      isObjectType(fields["value"].type.ofType))
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' return type must have field 'value' with non-null object type`,
    );
  }
}

/**
 * Validate query arguments
 *
 * - single `id: ID!` argument
 * @param args arguments
 * @param queryName query name
 */
export function validateQueryArguments(
  args: readonly GraphQLArgument[],
  queryName: string,
) {
  if (
    !(args.length == 1 && args[0].name == "id" &&
      isNonNullType(args[0].type) && isScalarType(args[0].type.ofType) &&
      args[0].type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' must have single 'id: ID!' argument`,
    );
  }
}

/**
 * Validate columns of table
 * @param columns columns
 * @param tableName table name
 */
export function validateTable(
  columns: GraphQLField<any, any>[],
  tableName: string,
): void {
  if (columns.length < 2) {
    throw new InvalidSchema(
      `Table '${tableName}' must have at least two columns`,
    );
  }

  if (!columns.some(isIdField)) {
    throw new InvalidSchema(
      `Table '${tableName}' must have an 'id: ID!' column`,
    );
  }
}

/**
 * Validate type of column
 *
 * - scalar type, possibly non-null
 * - reference object type
 * @param type column type
 * @param tableName table name
 * @param columnName column name
 */
export function validateColumn(
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
): void {
  if (isLeafType(type) || (isNonNullType(type) && isLeafType(type.ofType))) {
    // ok
  } else if (isType(type, isObjectType)) {
    // ok
  } else {
    throw new InvalidSchema(
      `Column '${columnName}' of table '${tableName}' has unexpected type '${type}'`,
    );
  }
}

/**
 * Validate row of table
 * @param row row of table
 * @param tableName name of table
 * @param id row id in table
 */
export function validateRow(
  row: unknown,
  tableName: string,
  id: string,
): asserts row is object {
  if (!isObject(row)) {
    throw new DatabaseCorruption(
      `Expected table '${tableName}' row '${id}' to be an object`,
    );
  }

  if (row.id !== id) {
    throw new DatabaseCorruption(
      `Expected table '${tableName}' row '${id}' column 'id' to be equal to row id`,
    );
  }
}

/**
 * Validate row of referenced table
 * @param row row of referenced table
 * @param referencedTableName name of referenced table
 * @param id row id in referenced table
 */
export function validateReferencedRow(
  row: unknown,
  referencedTableName: string,
  id: string,
): asserts row is object {
  if (row === null) {
    throw new DatabaseCorruption(
      `Expected referenced table '${referencedTableName}' to have row with id '${id}'`,
    );
  }

  if (!isObject(row)) {
    throw new DatabaseCorruption(
      `Expected referenced table '${referencedTableName}' row '${id}' to be an object`,
    );
  }

  if (row.id !== id) {
    throw new DatabaseCorruption(
      `Expected referenced table '${referencedTableName}' row '${id}' column 'id' to be equal to row id`,
    );
  }
}
