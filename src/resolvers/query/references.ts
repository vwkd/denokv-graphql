import {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
  isNonNullType,
} from "../../../deps.ts";
import {
  ConcurrentChange,
  DatabaseCorruption,
  listMultiple,
} from "../../utils.ts";
import { createResolver } from "./main.ts";
import {
  validateConnection,
  validateReferencesArgumentInputs,
  validateReferencesArguments,
  validateTable,
} from "./utils.ts";

/**
 * Create resolver for references field
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type field type
 * @param args field arguments
 * @param name field name
 * @param tableName table name
 * @param id row id
 * @param resolvers resolvers
 * @param middleware middleware
 */
// todo: allow non-null edge `[BookEdge!]!` in addition to nullable and handle accordingly if optional or not
export function createReferencesResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  args: readonly GraphQLArgument[],
  name: string,
  tableName: string,
  id: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  // todo: replace with `validateConnection` with table type instead of result type of table type in 'node'
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
  const tableType = fieldsEdge["node"].type.ofType;
  const referencedTableName = tableType.name;

  const columns = Object.values(tableType.getFields());
  validateTable(columns, referencedTableName);

  const columnNumber = columns.length;
  const columnNames = columns.map((column) => column.name);

  validateReferencesArguments(args, name);

  const resolver: IFieldResolver<any, any> = async (
    root,
    args,
    context,
  ) => {
    const first = args.first as number | undefined;
    const after = args.after as string | undefined;

    const last = args.last as number | undefined;
    const before = args.before as string | undefined;

    validateReferencesArgumentInputs(first, after, last, before);

    const rowId = root.id;
    const referenceKeys = [tableName, rowId, name];

    const checks = context.checks;

    // todo: should delete this intermediate check and instead just do final one in root_middleware?
    let res = await db.atomic()
      .check(...checks)
      .commit();

    if (!res.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change in some of the read rows. Try request again.`,
      );
    }

    if (first) {
      // note: get one more element to see if has next
      const referenceEntries = db.list({ prefix: referenceKeys }, {
        limit: first + 1,
        cursor: after,
      });

      let references: { id: string; cursor: string }[] = [];

      for await (const { key, value, versionstamp } of referenceEntries) {
        if (value) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have no value`,
          );
        }

        if (!(key.length == 4 && typeof key.at(-1) == "string")) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have single-level keys of strings`,
          );
        }

        if (key.at(-1).length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have key of non-empty string`,
          );
        }

        const id = key.at(-1) as string;

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = referenceEntries.cursor;

        references.push({ id, cursor });
      }

      if (!optional && references.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' column '${name}' to contain at least one reference`,
        );
      }

      // remove extra element if it exists
      if (references.length == first + 1) {
        references = references.slice(0, -1);
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const startCursorNext = referenceEntries.cursor;

      const pageInfo = {
        startCursor: references.at(0)?.cursor,
        endCursor: references.at(-1)?.cursor,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasPreviousPage: !!after,
        hasNextPage: !!startCursorNext,
      };

      // todo: what if empty?

      const prefixes = references.map(
        (reference) => [referencedTableName, reference.id],
      );

      const edges = [];

      for (const prefix of prefixes) {
        const id = prefix.at(-1) as string;

        const entries = db.list({ prefix });

        const node = {};

        for await (const { key, value, versionstamp } of entries) {
          // note: throw on first invalid entry instead of continuing to find all

          // todo: should allow deeper keys, if they are again references???

          if (!(key.length == 3 && typeof key.at(-1) == "string")) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' to have single-level keys of strings`,
            );
          }

          if (key.at(-1).length == 0) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' to have keys of non-empty strings`,
            );
          }

          const columnName = key.at(-1) as string;

          if (!columnNames.includes(columnName)) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' second-level key to be column name`,
            );
          }

          if (columnName == "id" && value !== id) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' column 'id' to be equal to row id`,
            );
          }

          checks.push({ key, versionstamp });

          node[columnName] = value;
        }

        if (!node.id) {
          throw new DatabaseCorruption(
            `Expected table '${referencedTableName}' row '${id}' to have column 'id'`,
          );
        }

        // todo: correctly allows less than since some columns might be optional?
        if (Object.keys(node).length > columnNumber) {
          throw new DatabaseCorruption(
            `Expected table '${referencedTableName}' row '${id}' to have at most '${columnNumber}' columns`,
          );
        }

        // note: uniquely exists since is key
        const cursor = references.find((reference) =>
          reference.id == id
        )!.cursor;

        edges.push({
          node,
          cursor,
        });
      }

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else if (last) {
      // note: get one more element to see if has next
      // note: `reverse` to go backwards instead of forwards, then reverse array to end up with forward order
      const referenceEntries = db.list({ prefix: referenceKeys }, {
        limit: last + 1,
        cursor: before,
        reverse: true,
      });

      let references: { id: string; cursor: string }[] = [];

      for await (const { key, value, versionstamp } of referenceEntries) {
        if (value) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have no value`,
          );
        }

        if (!(key.length == 4 && typeof key.at(-1) == "string")) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have single-level keys of strings`,
          );
        }

        if (key.at(-1).length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' column '${name}' to have key of non-empty string`,
          );
        }

        const id = key.at(-1) as string;

        context.checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = referenceEntries.cursor;

        references.unshift({ id, cursor });
      }

      if (!optional && references.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' column '${name}' to contain at least one reference`,
        );
      }

      // remove extra element if it exists
      if (references.length == last + 1) {
        references = references.slice(1);
      }

      // todo: what if now empty? only element was extra element...? also in other

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const endCursorNext = referenceEntries.cursor;

      const pageInfo = {
        startCursor: references.at(0)?.cursor,
        endCursor: references.at(-1)?.cursor,
        hasPreviousPage: !!endCursorNext,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasNextPage: !!before,
      };

      // todo: what if empty?

      const prefixes = references.map(
        (reference) => [referencedTableName, reference.id],
      );

      const edges = [];

      for (const prefix of prefixes) {
        const id = prefix.at(-1) as string;

        const entries = db.list({ prefix });

        const node = {};

        for await (const { key, value, versionstamp } of entries) {
          // note: throw on first invalid entry instead of continuing to find all
          if (!(key.length == 3 && typeof key.at(-1) == "string")) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' to have single-level keys of strings`,
            );
          }

          if (key.at(-1).length == 0) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' to have keys of non-empty strings`,
            );
          }

          const columnName = key.at(-1) as string;

          if (!columnNames.includes(columnName)) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' second-level key to be column name`,
            );
          }

          if (columnName == "id" && value !== id) {
            throw new DatabaseCorruption(
              `Expected table '${referencedTableName}' row '${id}' column 'id' to be equal to row id`,
            );
          }

          checks.push({ key, versionstamp });

          node[columnName] = value;
        }

        if (!node.id) {
          throw new DatabaseCorruption(
            `Expected table '${referencedTableName}' row '${id}' to have column 'id'`,
          );
        }

        // todo: correctly allows less than since some columns might be optional?
        if (Object.keys(node).length > columnNumber) {
          throw new DatabaseCorruption(
            `Expected table '${referencedTableName}' row '${id}' to have at most '${columnNumber}' columns`,
          );
        }

        // note: uniquely exists since is key
        const cursor = references.find((reference) =>
          reference.id == id
        )!.cursor;

        edges.push({
          node,
          cursor,
        });
      }

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else {
      throw new Error(`should be unreachable`);
    }
  };

  resolvers[tableName][name] = resolver;

  createResolver(db, tableType, resolvers, middleware);
}
