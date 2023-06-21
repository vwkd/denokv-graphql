import { GraphQLSchema } from "../../deps.ts";
import type { IResolvers } from "../../deps.ts";
import { createResolverTransaction } from "./mutation/transaction.ts";
import {
  validateTransactionArguments,
  validateTransactionReturn,
} from "./mutation/utils.ts";

/**
 * Create resolvers for mutations
 *
 * - don't walk recursively to next queriable table since always returns result
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

  const transactions = mutationType.getFields();

  for (const [transactionName, transaction] of Object.entries(transactions)) {
    const type = transaction.type;

    validateTransactionReturn(type, transactionName);

    const args = transaction.args;

    validateTransactionArguments(args, transactionName);

    // note: asserted in `validateTransactionArguments`
    const data = args.find((arg) => arg.name == "data")!;
    const transactionInput = data.type.ofType;

    createResolverTransaction(
      db,
      schema,
      transactionInput,
      transactionName,
      resolvers[rootMutationName],
    );
  }
}
