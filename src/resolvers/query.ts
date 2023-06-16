import { isNonNullType } from "../../deps.ts";
import type { GraphQLObjectType, IResolvers } from "../../deps.ts";
import { validateTable } from "./utils.ts";
import { createResolverOptional } from "./query_list_object_scalar.ts";

/**
 * Create resolvers for a table
 *
 * Walk recursively to next queriable table
 *
 * note: recursive, mutates resolvers object
 * @param db Deno KV database
 * @param table table object
 * @param resolvers resolvers object
 */
// todo: make tail call recursive instead of mutating outer state
export function createQueryResolver(
  db: Deno.Kv,
  table: GraphQLObjectType,
  resolvers: IResolvers,
): void {
  const tableName = table.name;

  if (resolvers[tableName]) {
    // console.debug(`Skipping resolvers for table '${tableName}' because already exist`);
    return;
  } else {
    // console.debug(`Creating resolvers for table '${tableName}'`);
  }

  resolvers[tableName] = {};

  const columns = Object.values(table.getFields());

  validateTable(columns, tableName);

  for (const column of columns) {
    const columnName = column.name;
    const type = column.type;

    // console.debug(`Creating resolvers for column '${columnName}'`);

    if (isNonNullType(type)) {
      const innerType = type.ofType;
      createResolverOptional(
        db,
        innerType,
        tableName,
        columnName,
        resolvers,
        false,
      );
    } else {
      createResolverOptional(db, type, tableName, columnName, resolvers, true);
    }
  }
}
