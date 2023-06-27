import type {
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
import { createResolver } from "./main.ts";
import { isLeaf, validateTable } from "./utils.ts";

/**
 * Create resolver for reference field
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type field type
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optional if result can be null
 */
export function createReferenceResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  name: string,
  tableName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  const columns = Object.values(type.getFields());
  validateTable(columns, tableName);

  const resolver: IFieldResolver<any, any> = async (
    root,
    _args,
    context,
  ) => {
    const rowId = root.id;
    const referenceKey = [tableName, rowId, name];

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

    // expects 1 entry, but tries to get 2 (or 0) for error checking
    const referenceEntry = db.list({ prefix: referenceKey }, { limit: 2 });

    let referenceIdArr: string[] = [];

    for await (const { key, value, versionstamp } of referenceEntry) {
      if (!(key.length == 4 && typeof key.at(-1) == "string")) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' column '${name}' to have single-level key of string`,
        );
      }

      if (value !== undefined) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' column '${name}' to have empty value`,
        );
      }

      referenceIdArr.push(key.at(-1));

      context.checks.push({ key, versionstamp });
    }

    if (referenceIdArr.length == 2) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${name}' to have single key`,
      );
    }

    if (!optional && referenceIdArr.length == 0) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${name}' to contain id`,
      );
    }

    // string or undefined if empty optional column
    let referenceId = referenceIdArr[0];

    if (optional && referenceId === undefined) {
      return null;
    }

    const keys = columns
      .filter((column) => isLeaf(column.type))
      .map((column) => [referencedTableName, referenceId, column.name]);

    const entries = await db.getMany(keys);

    const node = {};

    for (const { key, value, versionstamp } of entries) {
      const columnName = key.at(-1)! as string;

      if (columnName == "id" && value !== id) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${id}' column 'id' to be equal to row id`,
        );
      }

      if (value !== null) {
        node[columnName] = value;
      }

      context.checks.push({ key, versionstamp });
    }

    return node;
  };

  resolvers[tableName][name] = resolver;

  createResolver(db, type, resolvers, middleware);
}
