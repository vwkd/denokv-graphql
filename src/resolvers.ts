import {
  GraphQLSchema,
  isLeafType,
  isListType,
  isNonNullType,
  isObjectType,
} from "../deps.ts";
import type {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLLeafType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
  IFieldResolver,
  IResolvers,
} from "../deps.ts";
import { isIdArguments, isIdField } from "./checks.ts";
import { DatabaseCorruption, InvalidSchema } from "./utils.ts";

type NullableTypes =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLList<GraphQLOutputType>;

/**
 * Generate the resolvers for Deno KV
 * @param db Deno KV database
 * @param schema schema object
 * @returns resolvers for Deno KV
 */
export function generateResolvers(
  db: Deno.Kv,
  schema: GraphQLSchema,
): IResolvers {
  const resolvers: IResolvers = {};

  // todo: handle other root types
  const queryObject = schema.getQueryType();

  if (!queryObject) {
    throw new InvalidSchema(`Schema must have a root query type`);
  }

  const queryName = queryObject.name;

  resolvers[queryName] = {};

  // an object type is a table, validate below
  const tables = queryObject.getFields();

  for (const table of Object.values(tables)) {
    const fieldName = table.name;
    const type = table.type;

    // todo: better error messages, e.g. non-null `bookById: Book!` is error because database might return null, etc.
    if (!isObjectType(type)) {
      throw new InvalidSchema(
        `Query field '${fieldName}' has unexpected type '${type}'`,
      );
    }

    const tableName = type.name;

    if (!isIdArguments(table.args)) {
      throw new InvalidSchema(
        `Query field '${fieldName}' must have single 'id: ID!' argument`,
      );
    }

    resolvers[queryName][fieldName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      const id = args.id;

      const key = [tableName, id];

      const entry = await db.get(key);

      return entry.value;
    };

    createResolver(db, type, resolvers);
  }

  return resolvers;
}

/**
 * Create resolvers for a table and walk recursively to next
 *
 * note: recursive, mutates resolvers object
 * @param db Deno KV database
 * @param table table object
 * @param resolvers resolvers object
 */
// todo: make tail call recursive instead of mutating outer state
function createResolver(
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

  // a field is a column
  // simple if scalar type or table reference if another object type
  const columns = Object.values(table.getFields());

  if (!(columns && columns.length > 1)) {
    throw new InvalidSchema(
      `Table '${tableName}' must have at least two columns`,
    );
  }

  if (!columns.some(isIdField)) {
    throw new InvalidSchema(
      `Table '${tableName}' must have an 'id: ID!' column`,
    );
  }

  for (const column of columns) {
    const columnName = column.name;
    const type = column.type;

    if (isNonNullType(type)) {
      const innerType = type.ofType;
      createResolverOptional(db, innerType, tableName, columnName, resolvers);
    } else {
      createResolverOptional(db, type, tableName, columnName, resolvers);
    }
  }
}

/**
 * Create resolver for optional column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type nullable type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 */
function createResolverOptional(
  db: Deno.Kv,
  type: NullableTypes,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
): void {
  if (isLeafType(type)) {
    createResolverSimpleOptional(db, type, tableName, resolvers);
  } else if (isObjectType(type)) {
    createResolverReferenceSingleOptional(
      db,
      type,
      tableName,
      columnName,
      resolvers,
    );
  } else if (isListType(type)) {
    const innerType = type.ofType;
    createResolverReferenceMultiple(
      db,
      innerType,
      tableName,
      columnName,
      resolvers,
    );
  } else {
    throw new InvalidSchema(
      `Column '${columnName}' has unexpected type '${type}'`,
    );
  }
}

/**
 * Create resolver for multi-reference column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type list type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 */
function createResolverReferenceMultiple(
  db: Deno.Kv,
  type: GraphQLOutputType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
): void {
  if (isObjectType(type)) {
    createResolverReferenceMultipleOptional(
      db,
      type,
      tableName,
      columnName,
      resolvers,
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

/**
 * Create resolver for optional simple column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type leaf type
 * @param tableName table name
 * @param resolvers resolvers
 */
function createResolverSimpleOptional(
  _db: Deno.Kv,
  _type: GraphQLLeafType,
  _tableName: string,
  _resolvers: IResolvers,
): void {
  // noop, use default resolver
}

/**
 * Create resolver for optional single-reference column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 */
function createResolverReferenceSingleOptional(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
): void {
  // todo: handle non-null type
  const referencedTableName = type.name;

  // overwrites id in field value to object
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const id = root[columnName];

    if (id === undefined) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain id but found '${
          JSON.stringify(id)
        }'`,
      );
    }

    const key = [referencedTableName, id];

    const entry = await db.get(key);

    if (entry.value === null) {
      throw new DatabaseCorruption(
        `Referenced table '${referencedTableName}' has no row with id '${id}'`,
      );
    }

    return entry.value;
  };

  // recursively walk tree to create resolvers
  createResolver(db, type, resolvers);
}

/**
 * Create resolver for optional multi-reference column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type object type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 */
function createResolverReferenceMultipleOptional(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
): void {
  const referencedTableName = type.name;

  // overwrites array of ids in field value to array of objects
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const ids = root[columnName];

    if (!Array.isArray(ids)) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain array of ids but found '${
          JSON.stringify(ids)
        }'`,
      );
    }

    const keys = ids.map((id) => [referencedTableName, id]);

    const entries = await db.getMany(keys);

    const missing_ids: string[] = [];

    const values = entries.map(({ key, value }) => {
      if (value === null) {
        missing_ids.push(key.at(-1)!);
      }
      return value;
    });

    if (missing_ids.length) {
      throw new DatabaseCorruption(
        `Referenced table '${referencedTableName}' has no row${
          missing_ids.length > 1 ? "s" : ""
        } with id${missing_ids.length > 1 ? "s" : ""} '${
          missing_ids.join("', '")
        }'`,
      );
    }

    return values;
  };

  // recursively walk tree to create resolvers
  createResolver(db, type, resolvers);
}
