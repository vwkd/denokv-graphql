import { isNonNullType } from "../../../deps.ts";
import type { GraphQLObjectType, IResolvers } from "../../../deps.ts";
import { isReferences, validateColumn, validateTable } from "./utils.ts";
import { createReferencesResolver } from "./references.ts";
import { createLeafOrReferenceResolver } from "./leaf_or_reference.ts";

/**
 * Create resolvers for a table
 *
 * - walks recursively to child tables to attach resolvers
 * - note: allows schema to have orphan types not in tree since never reaches
 * - note: mutates resolvers
 * @param db Deno KV database
 * @param table table object
 * @param resolvers resolvers
 */
export function createResolver(
  db: Deno.Kv,
  table: GraphQLObjectType,
  resolvers: IResolvers,
): void {
  const tableName = table.name;

  resolvers[tableName] = {};

  const columns = Object.values(table.getFields());

  validateTable(columns, tableName);

  for (const column of columns) {
    const name = column.name;
    const type = column.type;

    validateColumn(type, tableName, name);

    if (isReferences(type)) {
      const innerType = type.ofType;
      createReferencesResolver(
        db,
        innerType,
        column.args,
        name,
        tableName,
        resolvers,
      );
    } else {
      let innerType = type;
      let optional = true;

      if (isNonNullType(innerType)) {
        innerType = innerType.ofType;
        optional = false;
      }

      createLeafOrReferenceResolver(
        db,
        innerType,
        name,
        tableName,
        resolvers,
        optional,
      );
    }
  }
}
