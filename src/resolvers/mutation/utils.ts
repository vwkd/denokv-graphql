import {
  isInputObjectType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../../deps.ts";
import type {
  FieldDefinitionNode,
  GraphQLArgument,
  GraphQLFieldMap,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
} from "../../../deps.ts";
import { InvalidSchema } from "../../utils.ts";
import { isSameWrapping, isType } from "../utils.ts";

/**
 * Validate insert mutation return value
 *
 * - name is 'Result'
 * - object type
 * @param type return value
 * @param mutationName mutation name
 */
export function validateInsertMutationReturn(
  returnValue: GraphQLOutputType,
  mutationName: string,
): asserts returnValue is GraphQLNonNull<GraphQLObjectType> {
  if (
    !(isObjectType(returnValue) &&
      returnValue.name == "Result")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have nullable 'Result' type`,
    );
  }
}

/**
 * Validate delete mutation return value
 *
 * - name is 'Void'
 * - nullable scalar type
 * @param type return value
 * @param mutationName mutation name
 */
export function validateDeleteMutationReturn(
  returnValue: GraphQLOutputType,
  mutationName: string,
): asserts returnValue is GraphQLNonNull<GraphQLScalarType> {
  if (
    !(isScalarType(returnValue) && returnValue.name == "Void")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have nullable 'Void' type`,
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
          `Mutation '${mutationName}' input table '${inputTableName}' column '${columnName}' must have same type as column in table '${tableName}' as 'ID'`,
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

/**
 * Validate delete mutation arguments
 *
 * - single "id: ID!" argument
 * @param args arguments
 * @param mutationName mutation name
 */
export function validateDeleteMutationArguments(
  args: readonly GraphQLArgument[],
  mutationName: string,
): void {
  const id = args.find((arg) => arg.name == "id");

  if (
    !(id && args.length == 1 && isNonNullType(id.type) &&
      isScalarType(id.type.ofType) &&
      id.type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have single 'id: ID!' argument`,
    );
  }
}
