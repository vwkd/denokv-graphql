import type {
  GraphQLLeafType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";

/**
 * Create resolver for leaf
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
export function createLeafResolver(
  db: Deno.Kv,
  _type: GraphQLLeafType,
  name: string,
  tableName: string,
  resolvers: IResolvers,
  _middleware: IMiddleware,
  optional: boolean,
): void {
  const resolver: IFieldResolver<any, any> = async (
    root,
    _args,
    context,
  ) => {
    const id = root.id;

    if (!id) {
      throw new Error(`should be unreachable`);
    }

    const key = [tableName, id, name];

    const checks = context.checks;

    // todo: should delete this intermediate check and instead just do final one in root_middleware?
    let resCheck = await db.atomic()
      .check(...checks)
      .commit();

    if (!resCheck.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change of previously read keys. Try request again.`,
      );
    }

    const { value, versionstamp } = await db.get(key);

    if (!optional && !value) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' row '${id}' column '${name}' to be non-empty`,
      );
    }

    context.checks.push({ key, versionstamp });

    // note: `null` if `optional` is `true`
    return value;
  };

  resolvers[tableName][name] = resolver;
}
