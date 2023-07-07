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

      // todo: paginate only over `[tableName, "*", "id"]` using `limit` if https://github.com/denoland/deploy_feedback/issues/415 is fixed
      const entries = db.list({ prefix: keysPrefix }, {
        cursor: after,
      });

      let rows = [];

      for await (const { key, value, versionstamp } of entries) {
        if (!(key.length == 3 || key.length == 4)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have three-level or four-level keys`,
          );
        }

        const rowId = key.at(1)!;
        const columnName = key.at(2)!;

        if (typeof rowId != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have row key of string`,
          );
        }

        if (rowId.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have row key of non-empty string`,
          );
        }

        if (typeof columnName != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of string`,
          );
        }

        if (columnName.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of non-empty string`,
          );
        }

        if (!columnNames.includes(columnName)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of column name`,
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

        // note: get one more element to see if has next
        if (rows.length >= first + 1) {
          break;
        }

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = entries.cursor;

        rows.push({ id: rowId, cursor, versionstamp });
      }

      let hasNextPage = false;

      // remove extra element if it exists
      if (rows.length == first + 1) {
        rows = rows.slice(0, -1);
        hasNextPage = true;
      }

      // todo: what if now empty? only element was extra element...?

      if (!optional && rows.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' to contain at least one row`,
        );
      }

      let edges = [];

      for (const { id, cursor, versionstamp } of rows) {
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
        hasNextPage,
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

      // todo: paginate only over `[tableName, "*", "id"]` using `limit` if https://github.com/denoland/deploy_feedback/issues/415 is fixed
      // note: `reverse` to go backwards instead of forwards, then reverse array to end up with forward order
      const entries = db.list({ prefix: keysPrefix }, {
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

        const rowId = key.at(1)!;
        const columnName = key.at(2)!;

        if (typeof rowId != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have row key of string`,
          );
        }

        if (rowId.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' to have row key of non-empty string`,
          );
        }

        if (typeof columnName != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of string`,
          );
        }

        if (columnName.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of non-empty string`,
          );
        }

        if (!columnNames.includes(columnName)) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' to have column key of column name`,
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

        // note: get one more element to see if has next
        if (rows.length >= last + 1) {
          break;
        }

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = entries.cursor;

        rows.unshift({ id: rowId, cursor, versionstamp });
      }

      let hasPreviousPage = false;

      // remove extra element if it exists
      if (rows.length == last + 1) {
        rows = rows.slice(1);
        hasPreviousPage = true;
      }

      // todo: what if now empty? only element was extra element...?

      if (!optional && rows.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' to contain at least one row`,
        );
      }

      let edges = [];

      for (const { id, cursor, versionstamp } of rows) {
        const row = {
          id,
        };

        const node = { value: row, versionstamp };

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
        hasPreviousPage,
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
