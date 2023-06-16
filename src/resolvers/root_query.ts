import { GraphQLSchema } from "../../deps.ts";
import type { IFieldResolver, IResolvers } from "../../deps.ts";
import { validateQueryArguments, validateQueryReturn } from "./utils.ts";
import { createQueryResolver } from "./query.ts";

/**
 * Create resolvers for queries
 *
 * - walk recursively to next queriable tables
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers object
 */
export function createRootQueryResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
): void {
  const queryObject = schema.getQueryType();

  if (!queryObject) {
    // console.debug(`Schema doesn't have a root query type`);
    return;
  }

  const rootQueryName = queryObject.name;

  resolvers[rootQueryName] = {};

  const queries = queryObject.getFields();

  for (const query of Object.values(queries)) {
    const queryName = query.name;
    const type = query.type;

    validateQueryReturn(type, queryName);

    const tableName = type.name;

    validateQueryArguments(query.args, queryName);

    resolvers[rootQueryName][queryName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      const id = args.id;

      const key = [tableName, id];

      const entry = await db.get(key);

      return entry.value;
    };

    createQueryResolver(db, type, resolvers);
  }
}
