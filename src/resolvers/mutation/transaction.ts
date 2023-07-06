import type {
  GraphQLInputObjectType,
  GraphQLSchema,
  IFieldResolver,
  IResolvers,
  StringValueNode,
} from "../../../deps.ts";
import {
  validateDeleteMutationReturn,
  validateInsertMutationReturn,
  validateMutationDirective,
  validateMutationTable,
} from "./utils.ts";
import { validateTable } from "../query/utils.ts";
import { ColumnType, columnTypes } from "./utils.ts";

const directiveNames = ["insert", "delete"];

/**
 * Create resolver for transaction
 *
 * - note: doesn't walk recursively child tables to attach resolvers since resolver returns result
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param schema schema
 * @param transactionInput transaction input object
 * @param transactionName transaction name
 * @param resolvers mutation resolvers object (beware: not root!)
 */
export function createResolverTransaction(
  db: Deno.Kv,
  schema: GraphQLSchema,
  transactionInput: GraphQLInputObjectType,
  transactionName: string,
  resolvers: IResolvers,
): void {
  const mutations = transactionInput.getFields();

  const insertMutationTableNames: Record<string, string> = {};
  const deleteMutationTableNames: Record<string, string> = {};
  const tableColumnTypes: Record<string, Record<string, ColumnType>> = {};

  for (const [mutationName, mutation] of Object.entries(mutations)) {
    const astNode = mutation.astNode!;

    validateMutationDirective(astNode, mutationName, directiveNames);

    // note: asserted in `validateMutationDirective`
    const directive = astNode.directives!.filter(({ name }) =>
      directiveNames.includes(name.value)
    )[0];

    // note: assumes valid schema
    // beware: currently bug in graphql-js that doesn't validate custom schema directive argument types, see [#3912](https://github.com/graphql/graphql-js/issues/3912)
    const args = directive.arguments!;
    const argument = args.find((arg) =>
      arg.name.value == "table"
    )!;
    const value = argument.value as StringValueNode;
    const tableName = value.value;

    const table = schema.getType(tableName);
    validateMutationTable(table, tableName, mutationName);

    const columnsMap = table.getFields();
    const columns = Object.values(columnsMap);
    validateTable(columns, tableName);

    // note: might overwrite multiple times, but identical
    tableColumnTypes[tableName] = columnTypes(columnsMap);

    const type = mutation.type;

    if (directive.name.value == "insert") {
      insertMutationTableNames[mutationName] = tableName;

      validateInsertMutationReturn(
        type,
        columnsMap,
        mutationName,
        tableName,
      );
    } else if (directive.name.value == "delete") {
      deleteMutationTableNames[mutationName] = tableName;

      validateDeleteMutationReturn(type, mutationName);
    }
  }

  resolvers[transactionName] = async (
    _root,
    args,
  ): Promise<IFieldResolver<any, any>> => {
    let op = db
      .atomic();

    for (const [mutationName, datas] of Object.entries(args.data)) {
      // note: only one exists
      const tableNameInsert = insertMutationTableNames[mutationName];
      const tableNameDelete = deleteMutationTableNames[mutationName];

      for (const data of datas) {
        const id = data.id;

        if (tableNameInsert) {
          for (const columnName of Object.keys(data)) {
            const key = [tableNameInsert, id, columnName];
            const versionstamp = null;

            op = op
              .check({ key, versionstamp });
          }
        } else if (tableNameDelete) {
          const key = [tableNameDelete, id, "id"];
          const versionstamp = data.versionstamp;

          op = op
            .check({ key, versionstamp });
        } else {
          throw new Error(`should be unreachable`);
        }
      }

      for (const data of datas) {
        const id = data.id;

        if (tableNameInsert) {
          for (const [columnName, value] of Object.entries(data)) {
            const columnType = tableColumnTypes[tableNameInsert][columnName];

            if (columnType == "references") {
              // array of ids
              for (const referenceId of value) {
                const key = [tableNameInsert, id, columnName, referenceId];

                op = op
                  .set(key, undefined);
              }
            } else if (columnType == "reference") {
              // single id
              const key = [tableNameInsert, id, columnName, value];

              op = op
                .set(key, undefined);
            } else if (columnType == "leaf") {
              // other value
              const key = [tableNameInsert, id, columnName];

              op = op
                .set(key, value);
            } else {
              throw new Error(`should be unreachable`);
            }
          }
        } else if (tableNameDelete) {
          for (
            const columnName of Object.keys(tableColumnTypes[tableNameDelete])
          ) {
            const key = [tableNameDelete, id, columnName];

            op = op
              .delete(key);
          }
        } else {
          throw new Error(`should be unreachable`);
        }
      }
    }

    const res = await op.commit();

    if (!res.ok) {
      return null;
    }

    const versionstamp = res.versionstamp;

    return { versionstamp };
  };
}
