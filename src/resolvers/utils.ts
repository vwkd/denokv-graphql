import {
  assertEquals,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
} from "../../deps.ts";
import { InvalidSchema } from "../utils.ts";

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
 * Validate query return value
 *
 * - nullable object type
 * @param type return value
 * @param queryName query name
 */
// todo: better error messages, e.g. non-null `bookById: Book!` is error because database might return null, etc.
export function validateQueryReturn(
  returnValue: GraphQLOutputType,
  queryName: string,
): asserts returnValue is GraphQLObjectType {
  if (!(isObjectType(returnValue))) {
    throw new InvalidSchema(
      `Query '${queryName}' must have optional object type`,
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
 * Validate mutation return value
 *
 * - non null object type
 * @param type return value
 * @param mutationName mutation name
 */
export function validateMutationReturn(
  returnValue: GraphQLOutputType,
  mutationName: string,
): asserts returnValue is GraphQLNonNull<GraphQLObjectType> {
  if (!(isNonNullType(returnValue) && isObjectType(returnValue.ofType))) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have non-null object type`,
    );
  }
}

/**
 * Validate mutation arguments
 *
 * - contain all fields except `id: ID!` argument
 * - all fields are of same type except reference fields are of (wrapped) type `ID`
 * @param args arguments
 * @param columnsMap columns map
 * @param mutationName mutation name
 * @param tableName table name
 */
export function validateMutationArguments(
  args: readonly GraphQLArgument[],
  columnsMap: GraphQLFieldMap<any, any>,
  mutationName: string,
  tableName: string,
): void {
  const columns = Object.values(columnsMap);

  if (!(columns.length - 1 == args.length)) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have one argument for each column of table '${tableName}' except the 'id: ID!' column`,
    );
  }

  if (
    args.some((arg) =>
      arg.name == "id" && isNonNullType(arg.type) &&
      isScalarType(arg.type.ofType) && arg.type.ofType.name == "ID"
    )
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must not have an 'id: ID!' argument`,
    );
  }

  // todo: maybe use string comparison instead?
  for (const arg of args) {
    const column = columnsMap[arg.name];

    try {
      assertEquals(arg.type, column.type);
    } catch {
      throw new InvalidSchema(
        `Mutation '${mutationName}' must have a matching argument for each column of table '${tableName}' except the 'id: ID!' column`,
      );
    }
  }
}
