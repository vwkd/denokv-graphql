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

    validateQueryReturn(query.type, queryName);

    const fields = query.type.getFields();

    // note: asserted in `validateQueryReturn`
    const type = fields["value"].type.ofType as GraphQLObjectType;

    const tableName = type.name;

    validateQueryArguments(query.args, queryName);

    resolvers[rootQueryName][queryName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      const id = parseId(args.id, tableName);

      const key = [tableName, id];

      const entry = await db.get(key);

      // todo: what versionstamp to return here? has multiple versionstamps for nested queries across tables... make nested queries consistent using `atomic().check(..)`, then return its versionstamp here?
      const versionstamp = entry.versionstamp;
      const value = entry.value;

      if (value === null) {
        return null;
      }

      validateRow(value, tableName, id);

      return { id, value, versionstamp };
    };

    createQueryResolver(db, type, resolvers);
  }
}
