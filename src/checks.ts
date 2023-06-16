import { isNonNullType, isObjectType, isScalarType } from "../deps.ts";
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
} from "../deps.ts";

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
 * Test if arguments contain single `id: ID!` argument
 * @param args arguments
 * @returns boolean
 */
export function isIdArguments(args: readonly GraphQLArgument[]): boolean {
  return args.length == 1 && args[0].name == "id" &&
    isNonNullType(args[0].type) && isScalarType(args[0].type.ofType) &&
    args[0].type.ofType.name == "ID";
}

/**
 * Test if return value is non null and has `ok: Boolean!` and `versionstamp: String!` fields, e.g.
 *
 * ```graphql
 * type Result {
 *   ok: Boolean!,
 *   versionstamp: String!,
 * }
 * ```
 *
 * note: doesn't check `name`, can be "Result" or anything else.
 * @param type return value
 * @returns boolean
 */
// todo: narrow even further by constructing custom `Result` type
export function isResultReturnValue(
  returnValue: GraphQLOutputType,
): returnValue is GraphQLNonNull<GraphQLObjectType> {
  if (!(isNonNullType(returnValue) && isObjectType(returnValue.ofType))) {
    return false;
  }

  const fields = returnValue.ofType.getFields();

  const okField = fields["ok"];

  if (
    !(isNonNullType(okField.type) && isScalarType(okField.type.ofType) &&
      okField.type.ofType.name == "Boolean")
  ) {
    return false;
  }

  const versionstampField = fields["versionstamp"];

  if (
    !(isNonNullType(versionstampField.type) &&
      isScalarType(versionstampField.type.ofType) &&
      versionstampField.type.ofType.name == "String")
  ) {
    return false;
  }

  return true;
}
