import { isNonNullType, isObjectType } from "../../deps.ts";
import type { GraphQLOutputType, IResolvers } from "../../deps.ts";
import { createResolverObjectMany } from "./query_object_many.ts";

/**
 * Create resolver for list column
 *
 * - many values, multiple references
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param type list type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverList(
  db: Deno.Kv,
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isObjectType(type)) {
    createResolverObjectMany(
      db,
      type,
      tableName,
      columnName,
      resolvers,
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
        optional,
        false,
      );
    }
  }
}
