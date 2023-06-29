import { isNonNullType } from "../../../deps.ts";
import type {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
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
import { DatabaseCorruption } from "../../utils.ts";

/**
 * Create resolver for references
 *
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param type field type
 * @param args field arguments
 * @param name field name
 * @param rootQueryName root query name
 * @param resolvers resolvers
 */
export function createRootReferencesResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  args: readonly GraphQLArgument[],
  name: string,
  rootQueryName: string,
  resolvers: IResolvers,
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

    if (first) {
      const keysPrefix = [tableName];

      // todo: paginate only over `[tableName, "*", "id"]` if https://github.com/denoland/deploy_feedback/issues/415 is fixed, currently `limit` assumes correct keys and error checks if instead more or less
      // note: get one more element to see if has next
      const entries = db.list({ prefix: keysPrefix }, {
        // note: since paginates over column keyspace
        limit: (first * columnNumber) + 1,
        cursor: after,
      });

      let rows = [];

      for await (const { key, value, versionstamp } of entries) {
        if (!(key.length == 3 || key.length == 4)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have three-level or four-level keys`,
          );
        }

        const rowId = key.at(1);
        const columnName = key.at(2);

        if (typeof rowId != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of string`,
          );
        }

        if (rowId.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of non-empty string`,
          );
        }

        if (columnName && typeof columnName != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of string`,
          );
        }

        if (columnName && columnName.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of non-empty string`,
          );
        }

        if (!columnNames.includes(columnName)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' key '${columnName}' to be column name`,
          );
        }

        if (columnName != "id") {
          continue;
        }

        if (columnName == "id" && value !== rowId) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column 'id' to be equal to row id`,
          );
        }

        if (rows.length >= first) {
          break;
        }

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = entries.cursor;

        rows.push({ id: rowId, cursor, versionstamp });
      }

      if (!optional && rows.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' to contain at least one row`,
        );
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const startCursorNext = entries.cursor;

      let edges = [];

      for (const { id, cursor, versionstamp } of rows) {
        // todo: use versionstamp of whole row instead of only `id` key, but no single one exists since each column has own, can be updated independently, esp. in referenced row of another table

        const row = {
          id,
        };

        const node = { id, value: row, versionstamp };

        edges.push({
          node,
          cursor,
        });
      }

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
      const keysPrefix = [tableName];

      // todo: paginate only over `[tableName, "*", "id"]` if https://github.com/denoland/deploy_feedback/issues/415 is fixed, currently `limit` assumes correct keys and error checks if instead more or less
      // note: get one more element to see if has next
      // note: `reverse` to go backwards instead of forwards, then reverse array to end up with forward order
      const entries = db.list({ prefix: keysPrefix }, {
        // note: since paginates over column keyspace
        limit: (last * columnNumber) + 1,
        cursor: before,
        reverse: true,
      });

      let rows = [];

      for await (const { key, value, versionstamp } of entries) {
        if (!(key.length == 3 || key.length == 4)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have three-level or four-level keys`,
          );
        }

        const rowId = key.at(1);
        const columnName = key.at(2);

        if (typeof rowId != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of string`,
          );
        }

        if (rowId.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of non-empty string`,
          );
        }

        if (columnName && typeof columnName != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of string`,
          );
        }

        if (columnName && columnName.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${columnName}' to have key of non-empty string`,
          );
        }

        if (!columnNames.includes(columnName)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' key '${columnName}' to be column name`,
          );
        }

        if (columnName != "id") {
          continue;
        }

        if (columnName == "id" && value !== rowId) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column 'id' to be equal to row id`,
          );
        }

        if (rows.length >= last) {
          break;
        }

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = entries.cursor;

        rows.unshift({ id: rowId, cursor, versionstamp });
      }

      if (!optional && rows.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' to contain at least one row`,
        );
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const endCursorNext = entries.cursor;

      let edges = [];

      for (const { id, cursor, versionstamp } of rows) {
        // todo: use versionstamp of whole row instead of only `id` key, but no single one exists since each column has own, can be updated independently, esp. in referenced row of another table

        const row = {
          id,
        };

        const node = { id, value: row, versionstamp };

        edges.push({
          node,
          cursor,
        });
      }

      const pageInfo = {
        startCursor: edges.at(0)?.cursor,
        endCursor: edges.at(-1)?.cursor,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasNextPage: !!before,
        hasPreviousPage: !!endCursorNext,
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

  resolvers[rootQueryName][name] = resolver;

  createResolver(db, tableType, resolvers);
}
