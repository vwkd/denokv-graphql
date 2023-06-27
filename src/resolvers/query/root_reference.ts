import type {
  GraphQLArgument,
  GraphQLObjectType,
  GraphQLOutputType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import {
  isLeaf,
  validateQueryArguments,
  validateQueryReturn,
  validateTable,
} from "./utils.ts";
import { createResolver } from "./main.ts";
import { addQueryVersionstamp } from "./root_middleware.ts";

/**
 * Create resolver for single query
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type query type
 * @param args query arguments
 * @param name query name
 * @param rootName root query name
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createRootReferenceResolver(
  db: Deno.Kv,
  type: GraphQLOutputType,
  args: readonly GraphQLArgument[],
  name: string,
  rootName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
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
    const id = args.id;

    context.checks = [];

    const keys = columns
      .filter((column) => isLeaf(column.type))
      .map((column) => [tableName, id, column.name]);

    const entries = await db.getMany(keys);

    const node = {};

    for (const { key, value, versionstamp } of entries) {
      const columnName = key.at(-1)! as string;

      if (value !== null) {
        node[columnName] = value;
      }

      if (columnName == "id" && value !== id) {
        throw new DatabaseCorruption(
          `Expected table '${tableName}' row '${id}' column 'id' to be equal to row id`,
        );
      }

      context.checks.push({ key, versionstamp });
    }

    // note: row doesn't exist
    if (!node.id) {
      return null;
    }

    // todo: what to use as versionstamp for whole row? there is no one since can update each column independently, might update leaf or reference table...
    const versionstamp = "foo";

    return { id, value: node, versionstamp };
  };

  resolvers[rootName][name] = resolver;
  middleware[rootName][name] = addQueryVersionstamp(db);

  createResolver(db, tableType, resolvers, middleware);
}
