import { isNonNullType, isScalarType } from "../deps.ts";
import type { GraphQLArgument, GraphQLField } from "../deps.ts";

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
