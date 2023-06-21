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
    const id = args.data.id;
    const key = [tableName, id];

    const res = await db
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, args.data)
      .commit();

    if (!res.ok) {
      throw new InvalidInput(
        `Can't insert row with id '${id}' into table '${tableName}' because already exists`,
      );
    }

    return { id, versionstamp: res.versionstamp };
  };
}
