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
 * - one value, single reference
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverObjectOne(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites id in field value to object
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const id = root[columnName];

    if (optional && id === undefined) {
      return null;
    }

    if (id === undefined) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain id`,
      );
    }

    const key = [referencedTableName, id];

    const entry = await db.get(key);

    if (entry.value === null) {
      throw new DatabaseCorruption(
        `Referenced table '${referencedTableName}' has no row with id '${id}'`,
      );
    }

    return entry.value;
  };

  createQueryResolver(db, type, resolvers);
}
