import type {
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
import { createResolver } from "./main.ts";
import { validateTable } from "./utils.ts";

/**
 * Create resolver for reference field
 *
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param type field type
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createReferenceResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  name: string,
  tableName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  const columns = Object.values(type.getFields());
  validateTable(columns, tableName);

  const resolver: IFieldResolver<any, any> = async (
    root,
    _args,
    context,
  ) => {
    const rowId = root.id;

    if (!rowId) {
      throw new Error(`should be unreachable`);
    }

    const referenceKey = [tableName, rowId, name];

    const checks = context.checks;

    // todo: should delete this intermediate check and instead just do final one in root_middleware?
    let res = await db.atomic()
      .check(...checks)
      .commit();

    if (!res.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change of previously read keys. Try request again.`,
      );
    }

    // expects 1 entry, but tries to get 2 (or 0) for error checking
    const referenceEntry = db.list({ prefix: referenceKey }, { limit: 2 });

    let referenceIdArr: string[] = [];

    for await (const { key, value, versionstamp } of referenceEntry) {
      const idReference = key.at(-1);

      if (key.length != 4) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to have single-level key`,
        );
      }

      if (typeof idReference != "string") {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to have key of string`,
        );
      }

      if (idReference.length == 0) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to have key of non-empty string`,
        );
      }

      if (value !== undefined) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${rowId}' column '${name}' to have empty value`,
        );
      }

      // note: potentially pushes check for one bad item, but doesn't matter since will throw below
      context.checks.push({ key, versionstamp });

      referenceIdArr.push(idReference);
    }

    if (referenceIdArr.length == 2) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' row '${rowId}' column '${name}' to have single key`,
      );
    }

    if (!optional && referenceIdArr.length == 0) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' row '${rowId}' column '${name}' to have one key`,
      );
    }

    // note: `undefined` if empty optional column
    let referenceId = referenceIdArr[0];

    if (optional && referenceId === undefined) {
      return null;
    }

    // todo: how to validate that if referenceId is provided, row does exist, even if type is optional and 'id' field isn't queried?
    return {
      id: referenceId,
    };
  };

  resolvers[tableName][name] = resolver;

  createResolver(db, type, resolvers);
}
