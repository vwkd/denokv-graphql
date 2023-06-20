import type {
  GraphQLArgument,
  GraphQLFieldMap,
  IFieldResolver,
  IResolvers,
} from "../../../deps.ts";
import { InvalidInput } from "../../utils.ts";
import { validateInsertMutationArguments } from "./utils.ts";

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
    const datas = args.data;

    let op = db
      .atomic();

    for (const data of datas) {
      const id = data.id;
      const key = [tableName, id];

      op = op
        .check({ key, versionstamp: null })
        .set(key, data);
    }

    const res = await op.commit();

    if (!res.ok) {
      throw new InvalidInput(
        `Mutation '${mutationName}' failed to insert rows into table '${tableName}' because some ids already exist`,
      );
    }

    return { versionstamp: res.versionstamp };
  };
}
