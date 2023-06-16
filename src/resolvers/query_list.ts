import { isNonNullType, isObjectType } from "../../deps.ts";
import type { GraphQLOutputType, IResolvers } from "../../deps.ts";
import { InvalidSchema } from "../utils.ts";
import { createResolverReferenceMultipleOptional } from "./query_object_many.ts";

/**
 * Create resolver for multi-reference column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type list type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
export function createResolverReferenceMultiple(
  db: Deno.Kv,
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isObjectType(type)) {
    createResolverReferenceMultipleOptional(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      optional,
      true,
    );
  } else if (isNonNullType(type)) {
    const innerType = type.ofType;

    if (isObjectType(innerType)) {
      createResolverReferenceMultipleOptional(
        db,
        innerType,
        tableName,
        columnName,
        resolvers,
        optional,
        false,
      );
    } else {
      throw new InvalidSchema(
        `Column '${columnName}' has unexpected type '${type}'`,
      );
    }
  } else {
    throw new InvalidSchema(
      `Column '${columnName}' has unexpected type '${type}'`,
    );
  }
}
