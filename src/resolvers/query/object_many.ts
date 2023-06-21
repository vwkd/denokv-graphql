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
 * - many values, multiple references
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param middleware middleware
 * @param optionalList if result list can be null
 * @param optional if result can be null
 */
export function createResolverObjectMany(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
  optionalList: boolean,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites array of ids in field value to array of objects
  resolvers[tableName][columnName] = async (
    root,
    _args,
    context,
  ): Promise<IFieldResolver<any, any>> => {
    const ids = root[columnName];

    if (optionalList && ids === undefined) {
      return null;
    }

    if (
      !Array.isArray(ids) ||
      ids.some((id) => !(typeof id == "string"))
    ) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${columnName}' to contain array of strings`,
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

    const checks = context.checks;

    let res = await db.atomic()
      .check(...checks)
      .commit();

    if (!res.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change in some of the read rows. Try request again.`,
      );
    }

    const keys = ids.map((id) => [referencedTableName, id]);

    const entries = await db.getMany(keys);

    const values = entries.map(({ key, value, versionstamp }) => {
      // note: throw on first invalid entry instead of continuing to find all
      const id = key.at(-1)!;

      validateReferencedRow(value, referencedTableName, id);

      checks.push({ key, versionstamp });

      return value;
    });

    return values;
  };

  createQueryResolver(db, type, resolvers, middleware);
}
