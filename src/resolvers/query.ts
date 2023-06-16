import { isNonNullType } from "../../deps.ts";
import type { GraphQLObjectType, IResolvers } from "../../deps.ts";
import { validateTable } from "./utils.ts";
import { createResolverListObjectScalar } from "./query_list_object_scalar.ts";

/**
 * Create resolvers for a table
 *
 * - walk recursively to next queriable table
 * - note: mutates resolvers object
 * @param db Deno KV database
 * @param table table object
 * @param resolvers resolvers object
 */
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
      createResolverListObjectScalar(
        db,
        innerType,
        tableName,
        columnName,
        resolvers,
        false,
      );
    } else {
      createResolverListObjectScalar(
        db,
        type,
        tableName,
        columnName,
        resolvers,
        true,
      );
    }
  }
}
