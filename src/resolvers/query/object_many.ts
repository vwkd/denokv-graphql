import type {
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
} from "../../../deps.ts";
import { DatabaseCorruption } from "../../utils.ts";
import { createQueryResolver } from "./main.ts";
import { validateReferencedRow } from "./utils.ts";

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

    if (
      !Array.isArray(ids) ||
      ids.some((id) => !(typeof id == "bigint" && id > 0))
    ) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${columnName}' to contain array of positive bigints`,
      );
    }

    if (optional && ids.length == 0) {
      return [];
    }

    if (ids.length == 0) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${columnName}' to contain at least one reference`,
      );
    }

    const keys = ids.map((id) => [referencedTableName, id]);

    const entries = await db.getMany(keys);

    const values = entries.map(({ key, value }) => {
      // note: throw on first invalid entry instead of continuing to find all
      const id = key.at(-1)! as bigint;

      validateReferencedRow(value, referencedTableName, id);

      return value;
    });

    return values;
  };

  createQueryResolver(db, type, resolvers);
}
