import type {
  GraphQLArgument,
  IFieldResolver,
  IResolvers,
} from "../../../deps.ts";
import { parseId } from "./../utils.ts";
import { validateDeleteMutationArguments } from "./utils.ts";

/**
 * Create resolvers for delete mutations
 *
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param id row id
 * @param tableName table name
 * @param mutationName mutation name
 * @param resolvers mutation resolvers object (beware: not root!)
 */
export function createResolverDelete(
  db: Deno.Kv,
  args: readonly GraphQLArgument[],
  tableName: string,
  mutationName: string,
  resolvers: IResolvers,
): void {
  validateDeleteMutationArguments(
    args,
    mutationName,
  );

  resolvers[mutationName] = async (
    _root,
    args,
  ): Promise<IFieldResolver<any, any>> => {
    const id = parseId(args.id, tableName);

    const key = [tableName, id];

    await db.delete(key);
  };
}
