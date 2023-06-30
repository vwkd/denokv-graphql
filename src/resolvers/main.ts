import { GraphQLSchema } from "../../deps.ts";
import type { IResolvers } from "../../deps.ts";
import { createRootMutationResolver } from "./mutation/root.ts";
import { createRootQueryResolver } from "./query/root.ts";

/**
 * Generate the resolvers for Deno KV
 * @param db Deno KV database
 * @param schema schema object
 * @returns resolvers for Deno KV
 */
export function generateResolvers(
  db: Deno.Kv,
  schema: GraphQLSchema,
): IResolvers {
  const resolvers: IResolvers = {};

  createRootQueryResolver(db, schema, resolvers);

  createRootMutationResolver(db, schema, resolvers);

  return resolvers;
}
