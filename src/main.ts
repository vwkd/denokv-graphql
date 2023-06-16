import {
  addResolversToSchema,
  assertValidSchema,
  buildASTSchema,
  parse,
} from "../deps.ts";
import type { GraphQLSchema, Source } from "../deps.ts";
import { generateResolvers } from "./resolvers/main.ts";

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

  const schema = buildASTSchema(schemaAst);

  assertValidSchema(schema);

  const resolvers = generateResolvers(db, schema);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  return schemaNew;
}
