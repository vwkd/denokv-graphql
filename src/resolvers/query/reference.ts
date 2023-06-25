import type {
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
import { createResolver } from "./main.ts";
import { validateReferencedRow } from "./utils.ts";

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

  // overwrites id in field value to object  
  const resolver: IFieldResolver<any, any> = async (
    root,
    _args,
    context,
   ) => {
    const id = root[name] as string | undefined;

    if (optional && id === undefined) {
      return null;
    }

    if (id === undefined) {
      throw new DatabaseCorruption(
        `Expected column '${name}' to contain id`,
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

  resolvers[tableName][name] = resolver;

  createResolver(db, type, resolvers, middleware);
}
