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
import { createResolverList } from "./query_list.ts";
import { createResolverObjectOne } from "./query_object_one.ts";
import { createResolverScalar } from "./query_scalar.ts";

type NullableTypes =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLList<GraphQLOutputType>;

/**
 * Create resolver for a list, object or scalar column
 *
 * - one or many values, no or single or multiple references
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param type nullable type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverListObjectScalar(
  db: Deno.Kv,
  type: NullableTypes,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createResolverScalar(db, type, tableName, resolvers, optional);
  } else if (isObjectType(type)) {
    createResolverObjectOne(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      optional,
    );
  } else if (isListType(type)) {
    const innerType = type.ofType;
    createResolverList(
      db,
      innerType,
      tableName,
      columnName,
      resolvers,
      optional,
    );
  }
}
