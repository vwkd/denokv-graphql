import { isNonNullType, isObjectType } from "../../../deps.ts";
import type {
  GraphQLOutputType,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { createResolverObjectMany } from "./object_many.ts";

/**
 * Create resolver for list column
 *
 * - many values, multiple references
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type list type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optional if result can be null
 */
export function createResolverList(
  db: Deno.Kv,
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optional: boolean,
): void {
  if (isObjectType(type)) {
    createResolverObjectMany(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      middleware,
      optional,
      true,
    );
  } else if (isNonNullType(type)) {
    const innerType = type.ofType;

    if (isObjectType(innerType)) {
      createResolverObjectMany(
        db,
        innerType,
        tableName,
        columnName,
        resolvers,
        middleware,
        optional,
        false,
      );
    }
  }
}
