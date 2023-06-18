import {
  isInputObjectType,
  isLeafType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../deps.ts";
import type {
  FieldDefinitionNode,
  GraphQLArgument,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLType,
} from "../../deps.ts";
import { InvalidSchema } from "../utils.ts";

/**
 * Test if two types have the same wrapping types
 *
 * e.g. `[T!]!` and `[S!]!`, but not `[T]! and `[S]`
 * @param type1 first type
 * @param type2 second type
 */
function isSameWrapping(type1: GraphQLType, type2: GraphQLType): boolean {
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
 * Validate mutation return value
 *
 * - name is 'Result'
 * - non null object type
 * @param type return value
 * @param mutationName mutation name
 */
export function validateMutationReturn(
  returnValue: GraphQLOutputType,
  mutationName: string,
): asserts returnValue is GraphQLNonNull<GraphQLObjectType> {
  if (
    !(isNonNullType(returnValue) && isObjectType(returnValue.ofType) &&
      returnValue.ofType.name == "Result")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have non-null 'Result' type`,
    );
  }
}

/**
 * Validate one directive on mutation field
 *
 * - note: still allows additional unknown directives, e.g. `deprecated`, etc.
 * - note: assumes parsed IDL to access through `astNode`, currently graphql-js doesn't offer other way since doesn't allow defining directives programmatically
 * see [#1343](https://github.com/graphql/graphql-js/issues/1343)
 *
 * @param mutationName mutation name
 * @param directiveNames directive names
 */

export function validateMutationDirective(
  astNode: FieldDefinitionNode,
  mutationName: string,
  directiveNames: string[],
) {
  const directives = astNode.directives;

  if (!directives) {
    throw new InvalidSchema(`Mutation '${mutationName}' must have a directive`);
  }

  const directive = directives.filter(({ name }) =>
    directiveNames.includes(name.value)
  );

  if (directive.length != 1) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have one '${
        directiveNames.length > 1
          ? `${directiveNames.slice(0, -1).join("', '")}' or '${
            directiveNames.at(-1)
          }`
          : directiveNames[0]
      }' directive`,
    );
  }
}

/**
 * Validate mutation table
 * @param table table
 * @param tableName table name
 * @param mutationName mutation name
 */
export function validateMutationTable(
  table: GraphQLNamedType | undefined,
  tableName: string,
  mutationName: string,
): asserts table is GraphQLObjectType {
  if (!table) {
    throw new InvalidSchema(
      `Table '${tableName}' in mutation '${mutationName}' doesn't exist`,
    );
  }

  if (!isObjectType(table)) {
    throw new InvalidSchema(
      `Table '${tableName}' in mutation '${mutationName}' must be an object type`,
    );
  }
}

/**
 * Validate insert mutation arguments
 *
 * - single "data" argument with non-null input object type
 * - input object contains all fields, except `id: ID!` argument
 * - input object reference field is of `ID` type, wrapped in list or non-null depending on table field
 * - remaining input object fields are of same name and type as table fields
 * @param args arguments
 * @param columnsMap columns map of table
 * @param mutationName mutation name
 * @param tableName table name
 */
export function validateInsertMutationArguments(
  args: readonly GraphQLArgument[],
  columnsMap: GraphQLFieldMap<any, any>,
  mutationName: string,
  tableName: string,
): void {
  const data = args.find((arg) => arg.name == "data");

  if (
    !(data && args.length == 1 && isNonNullType(data.type) &&
      isInputObjectType(data.type.ofType))
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have single 'data' argument with non-null input object type`,
    );
  }

  const inputTableName = data.type.ofType.name;
  const inputColumnsMap = data.type.ofType.getFields();

  if (
    !(Object.values(columnsMap).length - 1 ==
      Object.values(inputColumnsMap).length)
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must have one column for each column of table '${tableName}' except the 'id' column`,
    );
  }

  if (inputColumnsMap["id"]) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must not have an 'id' column`,
    );
  }

  for (const [columnName, column] of Object.entries(columnsMap)) {
    if (columnName == "id") {
      continue;
    }

    if (!inputColumnsMap[columnName]) {
      throw new InvalidSchema(
        `Mutation '${mutationName}' input table '${inputTableName}' must have a column '${columnName}'`,
      );
    }

    if (isType(column.type, isObjectType)) {
      // reference column
      if (
        !(isType<GraphQLScalarType>(
          inputColumnsMap[columnName].type,
          (T): T is GraphQLScalarType => (isScalarType(T) && T.name == "ID"),
        ) && isSameWrapping(column.type, inputColumnsMap[columnName].type))
      ) {
        throw new InvalidSchema(
          `Mutation '${mutationName}' input table '${inputTableName}' column '${columnName}' must have same type as column in table '${tableName}' except as 'ID'`,
        );
      }
    } else {
      // leaf type column
      if (
        column.type.toString() != inputColumnsMap[columnName].type.toString()
      ) {
        throw new InvalidSchema(
          `Mutation '${mutationName}' input table '${inputTableName}' column '${columnName}' must have same type as column in table '${tableName}'`,
        );
      }
    }
  }
}
