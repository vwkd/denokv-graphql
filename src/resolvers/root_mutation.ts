import { GraphQLSchema } from "../../deps.ts";
import type {
  IFieldResolver,
  IResolvers,
  StringValueNode,
} from "../../deps.ts";
import {
  validateMutationArguments,
  validateMutationDirectiveInsert,
  validateMutationReturn,
  validateMutationTable,
  validateTable,
} from "./utils.ts";

/**
 * Create resolvers for mutations
 *
 * - don't walk recursively to next queriable table since always returns 'Result'
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
  const mutationType = schema.getMutationType();

  if (!mutationType) {
    return;
  }

  const rootMutationName = mutationType.name;

  resolvers[rootMutationName] = {};

  const mutations = mutationType.getFields();

  for (const mutation of Object.values(mutations)) {
    const mutationName = mutation.name;
    const type = mutation.type;

    validateMutationReturn(type, mutationName);

    const astNode = mutation.astNode!;

    validateMutationDirectiveInsert(astNode, mutationName);

    // note: assert in `validateMutationDirectiveInsert`
    const directives = astNode.directives!;

    const directive = directives.find(({ name }) => name.value == "insert")!;

    // note: assumes valid schema
    // beware: currently bug in graphql-js that doesn't validate custom schema directive argument types, see [#3912](https://github.com/graphql/graphql-js/issues/3912)
    const args = directive.arguments!;
    const argument = args.find((arg) => arg.name.value == "table")!;
    const value = argument.value as StringValueNode;
    const tableName = value.value;

    const table = schema.getType(tableName);
    validateMutationTable(table, tableName, mutationName);

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
}
