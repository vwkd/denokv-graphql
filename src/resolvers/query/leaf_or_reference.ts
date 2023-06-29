import { isLeafType, isObjectType } from "../../../deps.ts";
import type { GraphQLOutputType, IResolvers } from "../../../deps.ts";
import { createLeafResolver } from "./leaf.ts";
import { createReferenceResolver } from "./reference.ts";

/**
 * Create resolver for leaf or reference
 *
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param type field type
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createLeafOrReferenceResolver(
  db: Deno.Kv,
  type: GraphQLOutputType,
  name: string,
  tableName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createLeafResolver(
      db,
      type,
      name,
      tableName,
      resolvers,
      optional,
    );
  } else if (isObjectType(type)) {
    createReferenceResolver(
      db,
      type,
      name,
      tableName,
      resolvers,
      optional,
    );
  } else {
    throw new Error(`should be unreachable`);
  }
}
