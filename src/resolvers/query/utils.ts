import {
  isLeafType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
} from "../../../deps.ts";
import { DatabaseCorruption, InvalidSchema, isObject } from "../../utils.ts";
import { isIdField, isType } from "../utils.ts";

/**
 * Validate query return value
 *
 * - nullable object type
 * - field 'id' of non-null 'ID' type
 * - field 'versionstamp' of non-null 'String' type
 * - field `value` of non-null object type
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

/**
 * Validate list query arguments
 *
 * - either argument 'first' of non-null 'Int' and 'after' non-null 'ID'
 * - or argument 'last' of non-null 'Int' and 'before' non-null 'ID'
 * @param args arguments
 * @param queryName query name
 */
export function validateListQueryArguments(
  args: readonly GraphQLArgument[],
  queryName: string,
) {
  if (
    !(args.length == 2)
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' must have two arguments`,
    );
  }

  const first = args.find((arg) => arg.name == "first");
  const last = args.find((arg) => arg.name == "last");
  const after = args.find((arg) => arg.name == "after");
  const before = args.find((arg) => arg.name == "before");

  if (
    !(
      (first &&
        isNonNullType(first.type) &&
        isScalarType(first.type.ofType) &&
        first.type.ofType.name == "Int" && after &&
        isNonNullType(after.type) &&
        isScalarType(after.type.ofType) &&
        after.type.ofType.name == "ID") || (last &&
          isNonNullType(last.type) &&
          isScalarType(last.type.ofType) &&
          last.type.ofType.name == "Int" && before &&
          isNonNullType(before.type) &&
          isScalarType(before.type.ofType) &&
          before.type.ofType.name == "ID")
    )
  ) {
    throw new InvalidSchema(
      `Query '${queryName}' must have a 'first' / 'last' argument of non-null 'Int' type and an 'after' / 'before' argument of non-null 'ID' type`,
    );
  }
}

/**
 * Test if is list query
 *
 * - non-null? object type with name ending in "Connection"
 * @param type type
 * @returns
 */
export function isListQuery(
  type: GraphQLOutputType,
): type is GraphQLNonNull<GraphQLObjectType> {
  if (
    isNonNullType(type) && isObjectType(type.ofType) &&
    type.ofType.name.endsWith("Connection")
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Validate fields of connection
 *
 * - field 'edges' of non-null? list of object type
 * - field 'pageInfo' of non-null object type with name 'PageInfo'
 * @param type connection
 */
// todo: more fields like `totalCount`, `totalPageCount`?
export function validateConnection(type: GraphQLObjectType) {
  const name = type.name;
  const fields = type.getFields();

  if (
    !(Object.keys(fields).length == 2)
  ) {
    throw new InvalidSchema(
      `Connection '${name}' must have two fields`,
    );
  }

  const pageInfo = fields["pageInfo"];

  if (
    !(pageInfo &&
      isNonNullType(pageInfo.type) && isObjectType(pageInfo.type.ofType) &&
      pageInfo.type.ofType.name == "PageInfo")
  ) {
    throw new InvalidSchema(
      `Connection '${name}' must have field 'pageInfo' with non-null 'PageInfo' type`,
    );
  }

  const edges = fields["edges"];

  if (
    !(edges &&
      isNonNullType(edges.type) &&
      isListType(edges.type.ofType) &&
      isObjectType(edges.type.ofType.ofType) &&
      edges.type.ofType.ofType.name.endsWith("Edge"))
  ) {
    throw new InvalidSchema(
      `Connection '${name}' must have field 'edges' with non-null list object type whose name ends in 'Edge'`,
    );
  }

  const edge = edges.type.ofType.ofType;

  validateEdge(edge);
}

/**
 * Validate fields of edge
 *
 * - field 'node' of non-null? object type ??spec also allows nullable, and leaf types, interface, union, but not list type
 * - field 'cursor' of non-null? 'ID' ??spec also allows nullable and any scalar type that serializes as a string
 * @param type edge
 */
export function validateEdge(type: GraphQLObjectType) {
  const name = type.name;
  const fields = type.getFields();

  if (
    !(Object.keys(fields).length == 2)
  ) {
    throw new InvalidSchema(
      `Edge '${name}' must have two fields`,
    );
  }

  const cursor = fields["cursor"];

  if (
    !(cursor &&
      isNonNullType(cursor.type) && isScalarType(cursor.type.ofType) &&
      cursor.type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Edge '${name}' must have field 'cursor' with non-null 'ID' type`,
    );
  }

  const node = fields["node"];

  // todo: validate is 'BookResult'
  if (
    !(node &&
      isNonNullType(node.type) &&
      isObjectType(node.type.ofType))
  ) {
    throw new InvalidSchema(
      `Edge '${name}' must have field 'node' with non-null object type`,
    );
  }

  const result = node.type.ofType;

  validateResult(result);
}

// todo: deduplicate with `validateQueryReturn`
/**
 * Validate fields of result
 *
 * - nullable object type
 * - field 'id' of non-null 'ID' type
 * - field 'versionstamp' of non-null 'String' type
 * - field `value` of non-null object type
 * @param type result
 */
export function validateResult(
  type: GraphQLObjectType,
): void {
  const name = type.name;
  const fields = type.getFields();

  if (
    !(Object.keys(fields).length == 3)
  ) {
    throw new InvalidSchema(
      `Result '${name}' must have three fields`,
    );
  }

  const id = fields["id"];

  if (
    !(id &&
      isNonNullType(id.type) &&
      isScalarType(id.type.ofType) &&
      id.type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Result '${name}' must have field 'id' with non-null 'ID' type`,
    );
  }

  const versionstamp = fields["versionstamp"];

  if (
    !(versionstamp &&
      isNonNullType(versionstamp.type) &&
      isScalarType(versionstamp.type.ofType) &&
      versionstamp.type.ofType.name == "String")
  ) {
    throw new InvalidSchema(
      `Result '${name}' must have field 'versionstamp' with non-null 'String' type`,
    );
  }

  const value = fields["value"];

  if (
    !(value &&
      isNonNullType(value.type) &&
      isObjectType(value.type.ofType))
  ) {
    throw new InvalidSchema(
      `Result '${name}' must have field 'value' with non-null object type`,
    );
  }
}
