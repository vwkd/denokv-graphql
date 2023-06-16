import { GraphQLSchema } from "../../deps.ts";
import type { IFieldResolver, IResolvers } from "../../deps.ts";
import {
  validateMutationArguments,
  validateMutationReturn,
  validateTable,
} from "./utils.ts";
import { createQueryResolver } from "./query.ts";

/**
 * Create resolvers for mutations
 *
 * - walk recursively to next queriable table since not necessarily
 * included in query root type
 * - validate table since not necessarily included in query tree
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers object
 */
export function createRootMutationResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
): void {
  const mutationObject = schema.getMutationType();

  if (!mutationObject) {
    // console.debug(`Schema doesn't have a root mutation type`);
    return;
  }

  const rootMutationName = mutationObject.name;

  resolvers[rootMutationName] = {};

  const mutations = mutationObject.getFields();

  for (const mutation of Object.values(mutations)) {
    const mutationName = mutation.name;
    const type = mutation.type;

    validateMutationReturn(type, mutationName);

    const table = type.ofType;
    const tableName = table.name;

    const columnsMap = table.getFields();
    const columns = Object.values(columnsMap);
    validateTable(columns, tableName);

    validateMutationArguments(
      mutation.args,
      columnsMap,
      mutationName,
      tableName,
    );

    resolvers[rootMutationName][mutationName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      let newId = 1;
      let res: Deno.KvCommitResult | Deno.KvCommitError = { ok: false };

      while (!res.ok) {
        const entries = db.list({ prefix: [tableName] }, {
          limit: 1,
          reverse: true,
        });
        const entry = await entries.next();

        const value = entry.value;

        if (!value) {
          const key = [tableName, newId];
          const value = { id: newId, ...args };

          res = await db.set(key, value);
        } else {
          const lastId = value.key.at(-1)!;
          newId = Number(lastId) + 1;

          const key = [tableName, newId];
          const val = { id: newId, ...args };

          res = await db
            .atomic()
            .check(value)
            .set(key, val)
            .commit();
        }
      }

      const key = [tableName, newId];
      const r = await db.get(key);

      if (r.versionstamp === null) {
        throw new Error(`unexpected non-existent key, just set it above...`);
      } else {
        return r.value;
      }
    };

    createQueryResolver(db, table, resolvers);
  }
}
