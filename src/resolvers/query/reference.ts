import type {
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
import { createQueryResolver } from "./main.ts";
import { validateReferencedRow } from "./utils.ts";

/**
 * Create resolver for object column
 *
 * - one value, single reference
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optional if result can be null
 */
export function createResolverObjectOne(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites id in field value to object
  resolvers[tableName][columnName] = async (
    root,
    _args,
    context,
  ): Promise<IFieldResolver<any, any>> => {
    const id = root[columnName] as string | undefined;

    if (optional && id === undefined) {
      return null;
    }

    if (id === undefined) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain id`,
      );
    }

    const checks = context.checks;

    let res = await db.atomic()
      .check(...checks)
      .commit();

    if (!res.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change in some of the read rows. Try request again.`,
      );
    }

    const key = [referencedTableName, id];

    const entry = await db.get(key);

    const value = entry.value;
    const versionstamp = entry.versionstamp;

    validateReferencedRow(value, referencedTableName, id);

    checks.push({ key, versionstamp });

    return value;
  };

  createQueryResolver(db, type, resolvers, middleware);
}
