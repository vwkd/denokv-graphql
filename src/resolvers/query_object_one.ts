import type {
  GraphQLObjectType,
  IFieldResolver,
  IResolvers,
} from "../../deps.ts";
import { DatabaseCorruption } from "../utils.ts";
import { createQueryResolver } from "./query.ts";
import { validateReferencedRow } from "./utils.ts";

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
    const id = root[columnName] as bigint | undefined;

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

    const value = entry.value;

    validateReferencedRow(value, referencedTableName, id);

    return value;
  };

  createQueryResolver(db, type, resolvers);
}
