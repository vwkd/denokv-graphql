import { isLeafType, isListType, isObjectType } from "../../deps.ts";
import type {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
  IResolvers,
} from "../../deps.ts";
import { InvalidSchema } from "../utils.ts";
import { createResolverReferenceMultiple } from "./query_list.ts";
import { createResolverReferenceSingleOptional } from "./query_object_one.ts";
import { createResolverSimpleOptional } from "./query_scalar.ts";

type NullableTypes =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLList<GraphQLOutputType>;

/**
 * Create resolver for optional column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type nullable type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverOptional(
  db: Deno.Kv,
  type: NullableTypes,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createResolverSimpleOptional(db, type, tableName, resolvers, optional);
  } else if (isObjectType(type)) {
    createResolverReferenceSingleOptional(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      optional,
    );
  } else if (isListType(type)) {
    const innerType = type.ofType;
    createResolverReferenceMultiple(
      db,
      innerType,
      tableName,
      columnName,
      resolvers,
      optional,
    );
  } else {
    throw new InvalidSchema(
      `Column '${columnName}' has unexpected type '${type}'`,
    );
  }
}
