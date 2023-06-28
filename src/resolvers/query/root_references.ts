import { isNonNullType } from "../../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import {
  validateConnection,
  validateQueryResult,
  validateReferencesArgumentInputs,
  validateReferencesArguments,
  validateTable,
} from "./utils.ts";
import { createResolver } from "./main.ts";
import { addQueryVersionstamp } from "./root_middleware.ts";
import { DatabaseCorruption } from "../../utils.ts";

/**
 * Create resolver for references
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type field type
 * @param args field arguments
 * @param name field name
 * @param rootQueryName root query name
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootReferencesResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  args: readonly GraphQLArgument[],
  name: string,
  rootQueryName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  validateConnection(type);

  // note: asserted in `validateConnection`
  const fieldsConnection = type.getFields();
  let edge = fieldsConnection["edges"].type.ofType.ofType;

  let optional = true;
  if (isNonNullType(edge)) {
    edge = edge.ofType;
    optional = false;
  }

  const fieldsEdge = edge.getFields();
  const node = fieldsEdge["node"].type.ofType;

  validateQueryResult(node);

  const fields = node.getFields();
  const tableType = fields["value"].type.ofType;
  const tableName = tableType.name;

  const columns = Object.values(tableType.getFields());
  validateTable(columns, tableName);

  const columnNumber = columns.length;
  const columnNames = columns.map((column) => column.name);

  validateReferencesArguments(args, name);

  const resolver: IFieldResolver<any, any> = async (
    _root,
    args,
    context,
  ) => {
    const first = args.first as number | undefined;
    const after = args.after as string | undefined;

    const last = args.last as number | undefined;
    const before = args.before as string | undefined;

    validateReferencesArgumentInputs(first, after, last, before);

    context.checks = [];

    // todo: how to paginate over `[tableName, "*", "id"]`?
    if (first) {
      const keysPrefix = [tableName];

      // note: get one more element to see if has next
      const entries = db.list({ prefix: keysPrefix }, {
        // note: since paginates over column keyspace
        limit: (first * columnNumber) + 1,
        cursor: after,
      });

      let rows = [];
      let currentId = "";
      let currentIndex = -1;
      let cursors = {};

      for await (const { key, value, versionstamp } of entries) {
        if (
          !(key.length == 3 && typeof key.at(-2) == "string" &&
            typeof key.at(-1) == "string")
        ) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have two-level keys of strings`,
          );
        }

        if (!(key.at(-2).length > 0 && key.at(-1).length > 0)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have keys of non-empty strings`,
          );
        }

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = entries.cursor;

        const id = key.at(-2) as string;
        const columnName = key.at(-1) as string;

        if (!columnNames.includes(columnName)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${id}' second-level key to be column name`,
          );
        }

        if (columnName == "id" && value !== id) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${id}' column 'id' to be equal to row id`,
          );
        }

        // next batch of keys of a row
        // note: assumes Deno KV stores sub-keys sorted
        if (id != currentId) {
          // validate previous row is complete
          // note: last row might be incomplete
          const lastIndex = currentIndex - 1;
          if (lastIndex >= 0) {
            // todo: what about optional columns that aren't set? should allow less than?
            if (Object.keys(rows[lastIndex]).length != columnNumber) {
              throw new DatabaseCorruption(
                `Expected table '${tableName}' row '${currentId}' to have '${columnNumber}' second-level keys for column`,
              );
            }
          }

          currentIndex += 1;
          currentId = id;
          rows[currentIndex] = {};
        }

        rows[currentIndex][columnName] = value;

        // note: overwrites constantly, last one survives
        cursors[id] = cursor;
      }

      // remove extra element if it exists
      if (rows.length == first + 1) {
        if (Object.keys(rows.at(-1)).length < columnNumber) {
          rows = rows.slice(0, -1);
        } else {
          throw new Error("should be unreachable");
        }
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const startCursorNext = entries.cursor;

      let edges = [];

      // todo: what if no entries?

      for (const row of rows) {
        const id = row.id;
        // todo: what to use as versionstamp for whole row? there is no one since can update each column independently, might update leaf or reference table...
        const versionstamp = "foo";

        const node = { id, value: row, versionstamp };
        const cursor = cursors[id];

        edges.push({
          node,
          cursor,
        });
      }

      // todo: handle optional, return null if optional, else throw?

      const pageInfo = {
        startCursor: edges.at(0)?.cursor,
        endCursor: edges.at(-1)?.cursor,
        hasNextPage: !!startCursorNext,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasPreviousPage: !!after,
      };

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else if (last) {
      // todo:
    } else {
      throw new Error(`should be unreachable`);
    }
  };

  resolvers[rootQueryName][name] = resolver;
  middleware[rootQueryName][name] = addQueryVersionstamp(db);

  createResolver(db, tableType, resolvers, middleware);
}
