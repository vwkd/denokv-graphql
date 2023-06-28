import { isLeafType, isObjectType } from "../../../deps.ts";
import type {
  GraphQLOutputType,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { createLeafResolver } from "./leaf.ts";
import { createReferenceResolver } from "./reference.ts";

/**
 * Create resolver for leaf or reference
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type field type
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optional if result can be null
 */
export function createLeafOrReferenceResolver(
  db: Deno.Kv,
  type: GraphQLOutputType,
  name: string,
  tableName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createLeafResolver(
      db,
      type,
      name,
      tableName,
      resolvers,
      middleware,
      optional,
    );
  } else if (isObjectType(type)) {
    createReferenceResolver(
      db,
      type,
      name,
      tableName,
      resolvers,
      middleware,
      optional,
    );
  } else {
    throw new Error(`should be unreachable`);
  }
}
