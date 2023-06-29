import {
  GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
  isNonNullType,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
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
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param type field type
 * @param args field arguments
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 */
// todo: allow non-null edge `[BookEdge!]!` in addition to nullable and handle accordingly if optional or not
export function createReferencesResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  args: readonly GraphQLArgument[],
  name: string,
  tableName: string,
  resolvers: IResolvers,
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

    if (!rowId) {
      throw new Error(`should be unreachable`);
    }

    const referenceKeysPrefix = [tableName, rowId, name];

    const checks = context.checks;

    if (first) {
      // note: get one more element to see if has next
      const referenceEntries = db.list({ prefix: referenceKeysPrefix }, {
        limit: first + 1,
        cursor: after,
      });

      let referencesIdArr: { id: string; cursor: string }[] = [];

      for await (const { key, value, versionstamp } of referenceEntries) {
        const idReference = key.at(-1);

        if (key.length != 4) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have single-level keys`,
          );
        }

        if (typeof idReference != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have keys of strings`,
          );
        }

        if (idReference.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have keys of non-empty strings`,
          );
        }

        if (value !== undefined) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have empty values`,
          );
        }

        checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = referenceEntries.cursor;

        referencesIdArr.push({ id: idReference, cursor });
      }

      if (!optional && referencesIdArr.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to contain at least one key`,
        );
      }

      let resCheck = await db.atomic()
        .check(...checks)
        .commit();

      if (!resCheck.ok) {
        throw new ConcurrentChange(
          `Detected concurrent change of previously read keys. Try request again.`,
        );
      }

      // remove extra element if it exists
      if (referencesIdArr.length == first + 1) {
        referencesIdArr = referencesIdArr.slice(0, -1);
      }

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const startCursorNext = referenceEntries.cursor;

      const pageInfo = {
        startCursor: referencesIdArr.at(0)?.cursor,
        endCursor: referencesIdArr.at(-1)?.cursor,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasPreviousPage: !!after,
        hasNextPage: !!startCursorNext,
      };

      // todo: what if empty?

      const edges = referencesIdArr.map((reference) => {
        return {
          node: {
            id: reference.id,
          },
          cursor: reference.cursor,
        };
      });

      const connection = {
        edges,
        pageInfo,
      };

      return connection;
    } else if (last) {
      // note: get one more element to see if has next
      // note: `reverse` to go backwards instead of forwards, then reverse array to end up with forward order
      const referenceEntries = db.list({ prefix: referenceKeysPrefix }, {
        limit: last + 1,
        cursor: before,
        reverse: true,
      });

      let referencesIdArr: { id: string; cursor: string }[] = [];

      for await (const { key, value, versionstamp } of referenceEntries) {
        const idReference = key.at(-1);

        if (key.length != 4) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have single-level keys`,
          );
        }

        if (typeof idReference != "string") {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have keys of strings`,
          );
        }

        if (idReference.length == 0) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have keys of non-empty strings`,
          );
        }

        if (value !== undefined) {
          throw new DatabaseCorruption(
            `Expected table '${tableName}' row '${rowId}' column '${name}' to have empty values`,
          );
        }

        checks.push({ key, versionstamp });

        // note: always non-empty string
        const cursor = referenceEntries.cursor;

        referencesIdArr.unshift({ id: idReference, cursor });
      }

      if (!optional && referencesIdArr.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to contain at least one key`,
        );
      }

      let resCheck = await db.atomic()
        .check(...checks)
        .commit();

      if (!resCheck.ok) {
        throw new ConcurrentChange(
          `Detected concurrent change of previously read keys. Try request again.`,
        );
      }

      // remove extra element if it exists
      if (referencesIdArr.length == last + 1) {
        referencesIdArr = referencesIdArr.slice(1);
      }

      // todo: what if now empty? only element was extra element...? also in other

      // note: cursor of next item if it exists, otherwise empty string if no further items, never `undefined`!
      const endCursorNext = referenceEntries.cursor;

      const pageInfo = {
        startCursor: referencesIdArr.at(0)?.cursor,
        endCursor: referencesIdArr.at(-1)?.cursor,
        hasPreviousPage: !!endCursorNext,
        // note: currently mistakenly set to `true` if passes bogus cursor that passes validation in `db.list`
        hasNextPage: !!before,
      };

      // todo: what if empty?

      const edges = referencesIdArr.map((reference) => {
        return {
          node: {
            id: reference.id,
          },
          cursor: reference.cursor,
        };
      });

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

  createResolver(db, tableType, resolvers);
}
