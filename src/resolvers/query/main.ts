import { isNonNullType } from "../../../deps.ts";
import type {
  GraphQLObjectType,
  IMiddleware,
  IResolvers,
} from "../../../deps.ts";
import { validateColumn, validateTable } from "./utils.ts";
import { createResolverListObjectScalar } from "./leaf_or_reference.ts";

/**
 * Create resolvers for a table
 *
 * - walks recursively to child tables to attach resolvers
 * - note: allows schema to have orphan types not in tree since never reaches
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param table table object
 * @param resolvers resolvers
 * @param middleware middleware
 */
export function createQueryResolver(
  db: Deno.Kv,
  table: GraphQLObjectType,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  const tableName = table.name;

  resolvers[tableName] = {};

  middleware[tableName] = {};

  const columns = Object.values(table.getFields());

  validateTable(columns, tableName);

  for (const column of columns) {
    const columnName = column.name;
    const type = column.type;

    validateColumn(type, tableName, columnName);

    if (isNonNullType(type)) {
      const innerType = type.ofType;
      createResolverListObjectScalar(
        db,
        innerType,
        tableName,
        columnName,
        resolvers,
        middleware,
        false,
      );
    } else {
      createResolverListObjectScalar(
        db,
        type,
        tableName,
        columnName,
        resolvers,
        middleware,
        true,
      );
    }
  }
}
