import { GraphQLSchema, VoidResolver } from "../../deps.ts";
import type { IResolvers } from "../../deps.ts";
import { createRootMutationResolver } from "./root_mutation.ts";
import { createRootQueryResolver } from "./root_query.ts";

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
  const resolvers: IResolvers = {
    Void: VoidResolver,
  };

  createRootQueryResolver(db, schema, resolvers);

  createRootMutationResolver(db, schema, resolvers);

  return resolvers;
}
