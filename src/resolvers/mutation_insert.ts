import type {
  GraphQLArgument,
  GraphQLFieldMap,
  IFieldResolver,
  IResolvers,
} from "../../deps.ts";
import {
  validateInsertMutationArguments,
} from "./utils.ts";

/**
 * Create resolvers for insert mutations
 *
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param columnsMap columns map
 * @param tableName table name
 * @param mutationName mutation name
 * @param resolvers mutation resolvers object (beware: not root!)
 */
export function createResolverInsert(
  db: Deno.Kv,
  args: readonly GraphQLArgument[],
  columnsMap: GraphQLFieldMap<any, any>,
  tableName: string,
  mutationName: string,
  resolvers: IResolvers,
): void {
  validateInsertMutationArguments(
    args,
    columnsMap,
    mutationName,
    tableName,
  );

  resolvers[mutationName] = async (
    _root,
    args,
  ): Promise<IFieldResolver<any, any>> => {
    let count = 0;
    let res: Deno.KvCommitResult | Deno.KvCommitError = { ok: false };

    while (!res.ok) {

      // get previous entry (if any)
      const entries = db.list({ prefix: [tableName] }, {
        limit: 1,
        reverse: true,
      });
      const entry = await entries.next();
      const value = entry.value;

      // no previous entry
      if (!value) {
        const id = 1;
        const key = [tableName, id];
        const value = { id, ...args };

        res = await db.set(key, value);
      } else {
        const lastId = value.key.at(-1)!;
        const id = Number(lastId) + 1;

        const key = [tableName, id];
        const val = { id, ...args };

        res = await db
          .atomic()
          .check(value)
          .set(key, val)
          .commit();
      }
    }

    return res;
  };
}
