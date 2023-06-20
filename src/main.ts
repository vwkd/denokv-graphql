import {
  addResolversToSchema,
  applyMiddleware,
  assertValidSchema,
  buildASTSchema,
  parse,
} from "../deps.ts";
import type { GraphQLSchema, Source } from "../deps.ts";
import { generateResolvers } from "./resolvers/main.ts";

/**
 * Patch `GraphQLID` to support serializing bigint to string in ID
 *
 * - spoofes bigint as number in `Number.isInteger`
 * - used internally when creating JSON response
 * - note: since JSON doesn't support bigints must send as strings in request, parse manually to bigint
 * - note: integer number in JSON is parsed to string by `GraphQLID`, must manually parse back to number too
 */
Number.isInteger = function (num) {
  if (typeof num == "bigint") {
    return true;
  } else {
    return Number.isInteger(num);
  }
};

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
    type Result {
      id: ID!,
      versionstamp: String!
    }

    directive @insert(
      table: String!
    ) on FIELD_DEFINITION

    directive @delete(
      table: String!
    ) on FIELD_DEFINITION

    scalar Void
  `;

  const schemaAst = parse(source + source_extension);

  const schema = buildASTSchema(schemaAst);

  assertValidSchema(schema);

  const { resolvers, middleware } = generateResolvers(db, schema);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  const schemaNewNew = applyMiddleware(schemaNew, middleware);

  return schemaNewNew;
}
