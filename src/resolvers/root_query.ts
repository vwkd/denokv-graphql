import { GraphQLSchema } from "../../deps.ts";
import type {
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
} from "../../deps.ts";
import { parseId } from "./utils.ts";
import {
  validateQueryArguments,
  validateQueryReturn,
  validateRow,
} from "./query/utils.ts";
import { createQueryResolver } from "./query/main.ts";

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
  // note: non-empty because asserted schema is valid
  const queryType = schema.getQueryType() as GraphQLObjectType<any, any>;

  const rootQueryName = queryType.name;

  resolvers[rootQueryName] = {};

  const queries = queryType.getFields();

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
      const id = parseId(args.id, tableName);

      const key = [tableName, id];

      const entry = await db.get(key);

      const value = entry.value;

      if (value === null) {
        return null;
      }

      validateRow(value, tableName, id);

      return value;
    };

    createQueryResolver(db, type, resolvers);
  }
}
