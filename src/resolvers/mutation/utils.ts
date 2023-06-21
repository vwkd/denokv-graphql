import {
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "../../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLFieldMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  InputValueDefinitionNode,
} from "../../../deps.ts";
import { InvalidSchema } from "../../utils.ts";
import { isSameWrapping, isType } from "../utils.ts";

/**
 * Validate mutation directive
 *
 * - single directive of known directives
 * - note: still allows additional unknown directives, e.g. `deprecated`, etc.
 * - note: assumes parsed IDL to access through `astNode`, currently graphql-js doesn't offer other way since doesn't allow defining directives programmatically
 * see [#1343](https://github.com/graphql/graphql-js/issues/1343)
 *
 * @param astNode input object field AST node
 * @param mutationName mutation name
 * @param directiveNames directive names
 */

export function validateMutationDirective(
  astNode: InputValueDefinitionNode,
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
 * Validate transaction return value
 *
 * - name is 'Result'
 * - nullable object type
 * @param type return value
 * @param transactionName transaction name
 */
export function validateTransactionReturn(
  type: GraphQLOutputType,
  transactionName: string,
): asserts type is GraphQLObjectType {
  if (
    !(isObjectType(type) &&
      type.name == "Result")
  ) {
    throw new InvalidSchema(
      `Transaction '${transactionName}' must return nullable 'Result' type`,
    );
  }
}

/**
 * Validate transaction arguments
 *
 * - single "data" argument with non-null input object type
 * @param args arguments
 * @param transactionName transaction name
 */
export function validateTransactionArguments(
  args: readonly GraphQLArgument[],
  transactionName: string,
): asserts args is [GraphQLInputObjectType] {
  const data = args.find((arg) => arg.name == "data");

  if (
    !(data && args.length == 1 && isNonNullType(data.type) &&
      isInputObjectType(data.type.ofType))
  ) {
    throw new InvalidSchema(
      `Transaction '${transactionName}' must return single 'data' argument with non-null input object type`,
    );
  }
}

/**
 * Validate insert mutation return type
 *
 * - non-null list non-null input object type
 * - input object contains all fields
 * - input object reference field is of `ID` type, wrapped in list or non-null depending on table field
 * - remaining input object fields are of same name and type as table fields
 * @param type insert mutation return type
 * @param columnsMap columns map of table
 * @param mutationName mutation name
 * @param tableName table name
 */
export function validateInsertMutationReturn(
  type: GraphQLInputType,
  columnsMap: GraphQLFieldMap<any, any>,
  mutationName: string,
  tableName: string,
): void {
  if (
    !(isNonNullType(type) &&
      isListType(type.ofType) && isNonNullType(type.ofType.ofType) &&
      isInputObjectType(type.ofType.ofType.ofType))
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have non-null list non-null input object type`,
    );
  }

  const inputTableName = type.ofType.ofType.ofType.name;
  const inputColumnsMap = type.ofType.ofType.ofType.getFields();

  if (
    !(Object.values(columnsMap).length ==
      Object.values(inputColumnsMap).length)
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must have one column for each column of table '${tableName}'`,
    );
  }

  for (const [columnName, column] of Object.entries(columnsMap)) {
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
 * Validate delete mutation return type
 *
 * - non-null list non-null input object type
 * - "id: ID!" and "versionstamp: String!" fields
 * @param type delete mutation return type
 * @param mutationName mutation name
 */
export function validateDeleteMutationReturn(
  type: GraphQLInputType,
  mutationName: string,
): void {
  if (
    !(isNonNullType(type) &&
      isListType(type.ofType) && isNonNullType(type.ofType.ofType) &&
      isInputObjectType(type.ofType.ofType.ofType))
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' must have non-null list non-null input object type`,
    );
  }

  const inputTableName = type.ofType.ofType.ofType.name;
  const inputColumnsMap = type.ofType.ofType.ofType.getFields();

  if (
    !(Object.values(inputColumnsMap).length == 2)
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must have two fields`,
    );
  }

  if (
    !(inputColumnsMap["id"] &&
      isNonNullType(inputColumnsMap["id"].type) &&
      isScalarType(inputColumnsMap["id"].type.ofType) &&
      inputColumnsMap["id"].type.ofType.name == "ID")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must have field 'id' with non-null 'ID' type`,
    );
  }

  if (
    !(inputColumnsMap["versionstamp"] &&
      isNonNullType(inputColumnsMap["versionstamp"].type) &&
      isScalarType(inputColumnsMap["versionstamp"].type.ofType) &&
      inputColumnsMap["versionstamp"].type.ofType.name == "String")
  ) {
    throw new InvalidSchema(
      `Mutation '${mutationName}' input table '${inputTableName}' must have field 'versionstamp' with non-null 'String' type`,
    );
  }
}
