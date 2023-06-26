import { GraphQLSchema } from "../../../deps.ts";
import type {
  GraphQLObjectType,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { isListQuery } from "./utils.ts";
import { createRootQueryOneResolver } from "./root_reference.ts";
import { createRootQueryListResolver } from "./root_references.ts";

/**
 * Create resolvers for queries
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootQueryResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  // note: non-empty because asserted schema is valid
  const queryType = schema.getQueryType() as GraphQLObjectType<any, any>;

  const rootQueryName = queryType.name;

  resolvers[rootQueryName] = {};

  middleware[rootQueryName] = {};

  const queries = queryType.getFields();

  for (const query of Object.values(queries)) {
    const queryName = query.name;

    if (isListQuery(query.type)) {
      createRootQueryListResolver(
        db,
        query.type.ofType,
        query.args,
        queryName,
        rootQueryName,
        resolvers,
        middleware,
      );
    } else {
      createRootQueryOneResolver(
        db,
        query.type,
        query.args,
        queryName,
        rootQueryName,
        resolvers,
        middleware,
      );
    }
  }
}
