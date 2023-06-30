import { GraphQLSchema } from "../../../deps.ts";
import type { GraphQLObjectType, IResolvers } from "../../../deps.ts";
import { isReferences } from "./utils.ts";
import { createRootReferenceResolver } from "./root_reference.ts";
import { createRootReferencesResolver } from "./root_references.ts";

/**
 * Create resolvers for queries
 *
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers
 */
export function createRootQueryResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
): void {
  // note: non-empty because asserted schema is valid
  const queryType = schema.getQueryType() as GraphQLObjectType<any, any>;

  const rootQueryName = queryType.name;

  resolvers[rootQueryName] = {};

  const queries = queryType.getFields();

  for (const query of Object.values(queries)) {
    const queryName = query.name;
    const type = query.type;
    const args = query.args;

    if (isReferences(type)) {
      const innerType = type.ofType;
      createRootReferencesResolver(
        db,
        innerType,
        args,
        queryName,
        rootQueryName,
        resolvers,
      );
    } else {
      createRootReferenceResolver(
        db,
        type,
        args,
        queryName,
        rootQueryName,
        resolvers,
      );
    }
  }
}
