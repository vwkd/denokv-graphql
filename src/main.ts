import { addResolversToSchema, buildASTSchema, parse } from "../deps.ts";
import type { GraphQLSchema, Source } from "../deps.ts";
import { generateResolvers } from "./resolvers.ts";

/**
 * Build a GraphQLSchema for Deno KV
 * @param db Deno KV database
 * @param source schema source document
 * @returns an executable schema for Deno KV
 */
export function buildSchema(
  db: Deno.Kv,
  source: string | Source,
): GraphQLSchema {
  const schemaAst = parse(source);

  // note: validates schema
  const schema = buildASTSchema(schemaAst);

  const resolvers = generateResolvers(db, schema);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  return schemaNew;
}
