import type {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../deps.ts";
import {
  validateConnection,
  validateListQueryArguments,
  validateRow,
} from "./query/utils.ts";
import { createQueryResolver } from "./query/main.ts";
import { addQueryVersionstamp } from "./root_query_middleware.ts";
import { DatabaseCorruption } from "../utils.ts";

/**
 * Create resolver for list query
 *
 * - walk recursively to next queriable tables
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param queryType query type
 * @param queryArgs query arguments
 * @param queryName query name
 * @param rootQueryName root query name
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootQueryListResolver(
  db: Deno.Kv,
  queryType: GraphQLObjectType,
  queryArgs: readonly GraphQLArgument[],
  queryName: string,
  rootQueryName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  validateConnection(queryType);

  // note: asserted in `validateConnection`
  const fieldsConnection = queryType.getFields();
  const edge = fieldsConnection["edges"].type.ofType.ofType;
  const fieldsEdge = edge.getFields();
  const node = fieldsEdge["node"].type.ofType;
  const fields = node.getFields();
  const type = fields["value"].type.ofType;

  const tableName = type.name;

  validateListQueryArguments(queryArgs, queryName);

  resolvers[rootQueryName][queryName] = async (
    _root,
    args,
    context,
  ): Promise<IFieldResolver<any, any>> => {
    const first = args.first as number | undefined;
    const after = args.after as string | undefined;

    const last = args.last as number | undefined;
    const before = args.before as string | undefined;

    context.checks = [];

    if (first) {
      const keyTable = [tableName];

      const entries = db.list({ prefix: keyTable }, {
        limit: first,
        cursor: after,
      });

      const edges = [];

      for await (const entry of entries) {
        const key = entry.key;
        const value = entry.value;
        const versionstamp = entry.versionstamp;

        if (!(key.length == 2 && typeof key.at(-1) == "string")) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have single-level keys of strings`,
          );
        }

        const id = key.at(-1) as string;

        validateRow(value, tableName, id);

        context.checks.push({ key, versionstamp });

        const node = { id, value, versionstamp };

        // note: always non-empty string
        const cursor = entries.cursor;

        edges.push({
          node,
          cursor,
        });
      }

      // note: next cursor after `after`, `undefined` if edges is empty
      const startCursor = edges.at(0)?.cursor;

      // note: previous cursor before `startCursorNext`, `undefined` if edges is empty
      const endCursor = edges.at(-1)?.cursor;

      // note: empty string if no further items, not `undefined`!
      const startCursorNext = entries.cursor;

      // note: add `startCursor` or `endCursor` only when non-empty string
      const pageInfo = {
        ...(startCursor && { startCursor }),
        ...(endCursor && { endCursor }),
        hasPreviousPage: !!after,
        hasNextPage: !!startCursorNext,
      };

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else if (last) {
      const keyTable = [tableName];
      const key = [tableName, after];

      // note: `end` is excluding, can't change here since doesn't know what next id is
      // note: needs `reverse` to start from end instead of start, then reverse array to end up with same order
      const entries = db.list({ prefix: keyTable, end: key }, {
        limit: last,
        reverse: true,
      });

      const res = [];

      for await (const entry of entries) {
        const key = entry.key;
        const value = entry.value;
        const versionstamp = entry.versionstamp;

        if (!(key.length == 2 && typeof key.at(-1) == "string")) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have single-level keys of strings`,
          );
        }

        const id = key.at(-1) as string;

        validateRow(value, tableName, id);

        context.checks.push({ key, versionstamp });

        res.unshift({ id, value, versionstamp });
      }

      // todo: return like above
      return res;
    } else {
      throw new Error(`should be unreachable`);
    }
  };

  // todo: adapt for new array in `root`!
  // createQueryResolver(db, type, resolvers, middleware);

  middleware[rootQueryName][queryName] = addQueryVersionstamp(db);
}
