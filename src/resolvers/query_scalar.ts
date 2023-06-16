import type { GraphQLLeafType, IResolvers } from "../../deps.ts";

/**
 * Create resolver for scalar column
 *
 * - one value, no reference
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param type leaf type
 * @param tableName table name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverScalar(
  _db: Deno.Kv,
  _type: GraphQLLeafType,
  _tableName: string,
  _resolvers: IResolvers,
  _optional: boolean,
): void {
  // noop, use default resolver
}