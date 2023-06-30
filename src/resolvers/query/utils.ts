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
import { InvalidInput, InvalidSchema } from "../../utils.ts";
import { isIdField } from "../utils.ts";

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
 * - leaf type, possibly non-null
 * - object type, possibly non-null
 * @param type column type
 * @param tableName table name
 * @param columnName column name
 */
export function validateColumn(
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
): void {
  let innerType = type;
  if (isNonNullType(innerType)) {
    innerType = innerType.ofType;
  }

  if (isLeafType(innerType)) {
    // ok
  } else if (isObjectType(innerType)) {
    // ok
  } else {
    throw new InvalidSchema(
      `Column '${columnName}' of table '${tableName}' must be leaf or object type`,
    );
  }
}

/**
 * Validate references arguments
 *
 * - argument 'first' of nullable 'Int' and 'after' nullable 'ID'
 * - argument 'last' of nullable 'Int' and 'before' nullable 'ID'
 * - note: validates at runtime that exactly one option is used
 * @param args field arguments
 * @param name field name
 */
export function validateReferencesArguments(
  args: readonly GraphQLArgument[],
  name: string,
) {
  if (
    !(args.length == 4)
  ) {
    throw new InvalidSchema(
      `Field '${name}' must have four arguments`,
    );
  }

  const first = args.find((arg) => arg.name == "first");

  if (
    !(
      first &&
      isScalarType(first.type) &&
      first.type.name == "Int"
    )
  ) {
    throw new InvalidSchema(
      `Field '${name}' must have 'first' argument of nullable 'Int' type`,
    );
  }

  const after = args.find((arg) => arg.name == "after");

  if (
    !(
      after &&
      isScalarType(after.type) &&
      after.type.name == "ID"
    )
  ) {
    throw new InvalidSchema(
      `Field '${name}' must have 'after' argument of nullable 'ID' type`,
    );
  }

  const last = args.find((arg) => arg.name == "last");

  if (
    !(
      last &&
      isScalarType(last.type) &&
      last.type.name == "Int"
    )
  ) {
    throw new InvalidSchema(
      `Field '${name}' must have 'last' argument of nullable 'Int' type`,
    );
  }

  const before = args.find((arg) => arg.name == "before");

  if (
    !(
      before &&
      isScalarType(before.type) &&
      before.type.name == "ID"
    )
  ) {
    throw new InvalidSchema(
      `Field '${name}' must have 'before' argument of nullable 'ID' type`,
    );
  }
}

/**
 * Test if is references
 *
 * - non-null object type with name ending in "Connection"
 * @param type type
 * @returns
 */
export function isReferences(
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
 * Test if is reference
 *
 * - nullable or non-null object type
 * @param type type
 * @returns
 */
export function isReference(
  type: GraphQLOutputType,
): boolean {
  let innerType = type;

  if (isNonNullType(innerType)) {
    innerType = innerType.ofType;
  }

  if (isObjectType(innerType)) {
    return true;
  }

  return false;
}

/**
 * Test if is leaf
 *
 * - non-null or nullable leaf type
 * @param type type
 * @returns
 */
export function isLeaf(
  type: GraphQLOutputType,
): boolean {
  let innerType = type;

  if (isNonNullType(innerType)) {
    innerType = innerType.ofType;
  }

  if (isLeafType(innerType)) {
    return true;
  }

  return false;
}

/**
 * Validate fields of connection
 *
 * - field 'edges' of non-null list of nullable or non-null object type
 * - field 'pageInfo' of non-null object type with name 'PageInfo'
 * @param type connection
 */
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
      isListType(edges.type.ofType))
  ) {
    throw new InvalidSchema(
      `Connection '${name}' must have field 'edges' with non-null list type`,
    );
  }

  let edge = edges.type.ofType.ofType;

  if (isNonNullType(edge)) {
    edge = edge.ofType;
  }

  if (
    !(isObjectType(edge) &&
      edge.name.endsWith("Edge"))
  ) {
    throw new InvalidSchema(
      `Connection '${name}' must have field 'edges' with non-null list type of object type whose name ends in 'Edge'`,
    );
  }

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

  if (
    !(node &&
      isNonNullType(node.type) &&
      isObjectType(node.type.ofType))
  ) {
    throw new InvalidSchema(
      `Edge '${name}' must have field 'node' with non-null object type`,
    );
  }
}

// todo: deduplicate with `validateQueryReturn`
/**
 * Validate fields of result in query
 *
 * - nullable object type
 * - field 'id' of non-null 'ID' type
 * - field 'versionstamp' of non-null 'String' type
 * - field `value` of non-null object type
 * @param type result
 */
export function validateQueryResult(
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

/**
 * Validate references argument inputs
 *
 * - either argument 'first' and optionally 'after'
 * - or argument 'last' and optionally 'before'
 * @param first argument 'first'
 * @param after argument 'after'
 * @param last argument 'last'
 * @param before argument 'before'
 */
export function validateReferencesArgumentInputs(
  first?: number,
  after?: string,
  last?: number,
  before?: string,
) {
  if (first && !last && !before) {
    // ok, noop
  } else if (last && !first && !after) {
    // ok, noop
  } else {
    throw new InvalidInput(
      `Expected either 'first' with optional 'after' or 'last' with optional 'before'`,
    );
  }
}
