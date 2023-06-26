import { isLeafType, isListType, isObjectType } from "../../../deps.ts";
import type {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { createResolverList } from "./list.ts";
import { createResolverObjectOne } from "./reference.ts";
import { createResolverScalar } from "./leaf.ts";

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
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type nullable type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optional if result can be null
 */
export function createResolverListObjectScalar(
  db: Deno.Kv,
  type: NullableTypes,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createResolverScalar(db, type, tableName, resolvers, middleware, optional);
  } else if (isObjectType(type)) {
    createResolverObjectOne(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      middleware,
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
      middleware,
      optional,
    );
  }
}
