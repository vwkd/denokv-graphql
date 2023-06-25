import type {
  GraphQLArgument,
  GraphQLObjectType,
  GraphQLOutputType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import {
  validateQueryArguments,
  validateQueryReturn,
  validateRow,
} from "./utils.ts";
import { createQueryResolver } from "./main.ts";
import { addQueryVersionstamp } from "./root_middleware.ts";

/**
 * Create resolver for single query
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param queryType query type
 * @param queryArgs query arguments
 * @param queryName query name
 * @param rootQueryName root query name
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootQueryOneResolver(
  db: Deno.Kv,
  queryType: GraphQLOutputType,
  queryArgs: readonly GraphQLArgument[],
  queryName: string,
  rootQueryName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  validateQueryReturn(queryType, queryName);

  const fields = queryType.getFields();

  // note: asserted in `validateQueryReturn`
  const type = fields["value"].type.ofType as GraphQLObjectType;

  const tableName = type.name;

  validateQueryArguments(queryArgs, queryName);

  resolvers[rootQueryName][queryName] = async (
    _root,
    args,
    context,
  ): Promise<IFieldResolver<any, any>> => {
    const id = args.id;

    const key = [tableName, id];

    const entry = await db.get(key);

    const versionstamp = entry.versionstamp;
    const value = entry.value;

    if (value === null) {
      return null;
    }

    validateRow(value, tableName, id);

    context.checks = [];
    context.checks.push({ key, versionstamp });

    return { id, value, versionstamp };
  };

  createQueryResolver(db, type, resolvers, middleware);

  middleware[rootQueryName][queryName] = addQueryVersionstamp(db);
}
