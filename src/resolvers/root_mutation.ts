import { GraphQLSchema } from "../../deps.ts";
import type { IResolvers, StringValueNode } from "../../deps.ts";
import { createResolverInsert } from "./mutation_insert.ts";
import {
  validateMutationDirective,
  validateMutationReturn,
  validateMutationTable,
  validateTable,
} from "./utils.ts";

const directiveNames = ["insert"];

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

    validateMutationDirective(astNode, mutationName, directiveNames);

    // note: assert in `validateMutationDirectiveInsert`
    const directives = astNode.directives!;
    const directive = directives.filter(({ name }) =>
      directiveNames.includes(name.value)
    )[0];

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

    if (directive.name.value == "insert") {
      createResolverInsert(
        db,
        mutation.args,
        columnsMap,
        tableName,
        mutationName,
        resolvers[rootMutationName],
      );
    }
  }
}
