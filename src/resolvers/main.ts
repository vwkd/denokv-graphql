import { GraphQLSchema } from "../../deps.ts";
import type { IMiddleware, IResolvers } from "../../deps.ts";
import { createRootMutationResolver } from "./mutation/root.ts";
import { createRootQueryResolver } from "./query/root.ts";

/**
 * Generate the resolvers for Deno KV
 * @param db Deno KV database
 * @param schema schema object
 * @returns resolvers and middleware for Deno KV
 */
export function generateResolvers(
  db: Deno.Kv,
  schema: GraphQLSchema,
): { resolvers: IResolvers; middleware: IMiddleware } {
  const resolvers: IResolvers = {};

  const middleware: IMiddleware = {};

  createRootQueryResolver(db, schema, resolvers, middleware);

  createRootMutationResolver(db, schema, resolvers);

  return { resolvers, middleware };
}
