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
  const source_extension = `
    directive @insert(
      table: String!
    ) on INPUT_FIELD_DEFINITION

    directive @delete(
      table: String!
    ) on INPUT_FIELD_DEFINITION

    type PageInfo {
      startCursor: ID
      endCursor: ID
      hasPreviousPage: Boolean!
      hasNextPage: Boolean!
    }
  `;

  const schemaAst = parse(source + source_extension);

  const schema = buildASTSchema(schemaAst);

  assertValidSchema(schema);

  const resolvers = generateResolvers(db, schema);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  return schemaNew;
}
