import type {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import {
  validateConnection,
  validateListArgumentInputs,
  validateListQueryArguments,
  validateRow,
} from "./utils.ts";
import { createQueryResolver } from "./main.ts";
import { addQueryVersionstamp } from "./root_middleware.ts";
import { DatabaseCorruption } from "../../utils.ts";

/**
 * Create resolver for list query
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

    validateListArgumentInputs(first, after, last, before);

    context.checks = [];

    if (first) {
      const keyTable = [tableName];

      // note: get one more element to see if has next
      const entries = db.list({ prefix: keyTable }, {
        limit: first + 1,
        cursor: after,
      });

      let edges = [];

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

      // remove extra element if it exists
      if (edges.length == first + 1) {
        edges = edges.slice(0, -1);
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const startCursorNext = entries.cursor;

      const pageInfo = {
        startCursor: edges.at(0)?.cursor,
        endCursor: edges.at(-1)?.cursor,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
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

      // note: get one more element to see if has next
      // note: `reverse` to go backwards instead of forwards, then reverse `edges` to end up with forward order
      const entries = db.list({ prefix: keyTable }, {
        limit: last + 1,
        cursor: before,
        reverse: true,
      });

      let edges = [];

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

        edges.unshift({
          node,
          cursor,
        });
      }

      // remove extra element if it exists
      if (edges.length == last + 1) {
        edges = edges.slice(1);
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const endCursorNext = entries.cursor;

      const pageInfo = {
        startCursor: edges.at(0)?.cursor,
        endCursor: edges.at(-1)?.cursor,
        hasPreviousPage: !!endCursorNext,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasNextPage: !!before,
      };

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else {
      throw new Error(`should be unreachable`);
    }
  };

  // todo: adapt for new array in `root`!
  // createQueryResolver(db, type, resolvers, middleware);

  middleware[rootQueryName][queryName] = addQueryVersionstamp(db);
}
