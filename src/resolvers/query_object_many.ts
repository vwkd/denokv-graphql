import type {
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
} from "../../deps.ts";
import { DatabaseCorruption } from "../utils.ts";
import { createQueryResolver } from "./query.ts";

/**
 * Create resolver for object column
 *
 * - many values, multiple references
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optionalList if result list can be null
 * @param optional if result can be null
 */
export function createResolverObjectMany(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optionalList: boolean,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites array of ids in field value to array of objects
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const ids = root[columnName];

    if (optionalList && ids === undefined) {
      return null;
    }

    if (!Array.isArray(ids)) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain array of ids but found '${
          JSON.stringify(ids)
        }'`,
      );
    }

    if (optional && ids.length == 0) {
      return [];
    }

    if (ids.length == 0) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain at least one reference but found zero`,
      );
    }

    const keys = ids.map((id) => [referencedTableName, id]);

    const entries = await db.getMany(keys);

    const missing_ids: string[] = [];

    const values = entries.map(({ key, value }) => {
      if (value === null) {
        missing_ids.push(key.at(-1)!);
      }
      return value;
    });

    if (missing_ids.length) {
      throw new DatabaseCorruption(
        `Referenced table '${referencedTableName}' has no row${
          missing_ids.length > 1 ? "s" : ""
        } with id${missing_ids.length > 1 ? "s" : ""} '${
          missing_ids.join("', '")
        }'`,
      );
    }

    return values;
  };

  createQueryResolver(db, type, resolvers);
}
