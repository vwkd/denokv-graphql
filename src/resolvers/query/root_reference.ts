import type {
  GraphQLArgument,
  GraphQLObjectType,
  GraphQLOutputType,
  IFieldResolver,
  IResolvers,
} from "../../../deps.ts";
import {
  validateQueryArguments,
  validateQueryReturn,
  validateTable,
} from "./utils.ts";
import { createResolver } from "./main.ts";
import { DatabaseCorruption } from "../../utils.ts";

/**
 * Create resolver for single query
 *
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param type query type
 * @param args query arguments
 * @param name query name
 * @param rootName root query name
 * @param resolvers resolvers
 */
export function createRootReferenceResolver(
  db: Deno.Kv,
  type: GraphQLOutputType,
  args: readonly GraphQLArgument[],
  name: string,
  rootName: string,
  resolvers: IResolvers,
): void {
  validateQueryReturn(type, name);

  const fields = type.getFields();

  // note: asserted in `validateQueryReturn`
  const tableType = fields["value"].type.ofType as GraphQLObjectType;
  const tableName = tableType.name;

  const columns = Object.values(tableType.getFields());
  validateTable(columns, tableName);

  validateQueryArguments(args, name);

  const resolver: IFieldResolver<any, any> = async (
    _root,
    args,
    context,
  ) => {
    const rowId = args.id;

    context.checks = [];

    const node = {
      id: rowId,
    };

    // row doesn't exist
    // note: duplicated `get` once more in leaf resolver for field 'id', but needs for nested queries too, also validates that value is equal to rowId
    const idKey = [tableName, rowId, "id"];

    const { key, value, versionstamp } = await db.get(idKey);

    context.checks.push({ key, versionstamp });

    if (value === null) {
      return null;
    }

    // todo: use versionstamp of whole row instead of only `id` key, but no single one exists since each column has own, can be updated independently, esp. in referenced row of another table
    return { value: node, versionstamp };
  };

  resolvers[rootName][name] = resolver;

  createResolver(db, tableType, resolvers);
}
