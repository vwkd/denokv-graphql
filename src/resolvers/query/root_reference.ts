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
import { createResolver } from "./main.ts";
import { addQueryVersionstamp } from "./root_middleware.ts";

/**
 * Create resolver for single query
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type query type
 * @param args query arguments
 * @param name query name
 * @param rootName root query name
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootReferenceResolver(
  db: Deno.Kv,
  type: GraphQLOutputType,
  args: readonly GraphQLArgument[],
  name: string,
  rootName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  validateQueryReturn(type, name);

  const fields = type.getFields();

  // note: asserted in `validateQueryReturn`
  const tableType = fields["value"].type.ofType as GraphQLObjectType;

  const tableName = tableType.name;

  validateQueryArguments(args, name);

  const resolver: IFieldResolver<any, any> = async (
    _root,
    args,
    context,
  ) => {
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

  resolvers[rootName][name] = resolver;
  middleware[rootName][name] = addQueryVersionstamp(db);

  createResolver(db, tableType, resolvers, middleware);
}
