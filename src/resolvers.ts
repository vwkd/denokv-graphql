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
import { isIdArguments, isIdField, isResultReturnValue } from "./checks.ts";
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

  createRootQueryResolver(db, schema, resolvers);

  createRootMutationResolver(db, schema, resolvers);

  return resolvers;
}

/**
 * Create resolvers for queries
 *
 * Walk recursively to next queriable tables
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers object
 */
// todo: make tail call recursive instead of mutating outer state
function createRootQueryResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
): void {
  const queryObject = schema.getQueryType();

  if (!queryObject) {
    // console.debug(`Schema doesn't have a root query type`);
    return;
  }

  const rootQueryName = queryObject.name;

  resolvers[rootQueryName] = {};

  const queries = queryObject.getFields();

  for (const query of Object.values(queries)) {
    const queryName = query.name;
    const type = query.type;

    // todo: better error messages, e.g. non-null `bookById: Book!` is error because database might return null, etc.
    if (!isObjectType(type)) {
      throw new InvalidSchema(
        `Query '${queryName}' has unexpected type '${type}'`,
      );
    }

    const tableName = type.name;

    if (!isIdArguments(query.args)) {
      throw new InvalidSchema(
        `Query '${queryName}' must have single 'id: ID!' argument`,
      );
    }

    resolvers[rootQueryName][queryName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      const id = args.id;

      const key = [tableName, id];

      const entry = await db.get(key);

      return entry.value;
    };

    createQueryResolver(db, type, resolvers);
  }
}

/**
 * Create resolvers for mutations
 *
 * Walk recursively to next queriable table
 *
 * note: recursive, mutates resolvers object
 * @param db Deno KV database
 * @param schema schema object
 * @param resolvers resolvers object
 */
// todo: make tail call recursive instead of mutating outer state
function createRootMutationResolver(
  db: Deno.Kv,
  schema: GraphQLSchema,
  resolvers: IResolvers,
): void {
  const mutationObject = schema.getMutationType();

  if (!mutationObject) {
    // console.debug(`Schema doesn't have a root mutation type`);
    return;
  }

  const rootMutationName = mutationObject.name;

  resolvers[rootMutationName] = {};

  const mutations = mutationObject.getFields();

  for (const mutation of Object.values(mutations)) {
    const mutationName = mutation.name;
    const type = mutation.type;

    if (!isResultReturnValue(type)) {
      throw new InvalidSchema(
        `Mutation '${mutationName}' must return non-null object type with fields 'ok: Boolean!' and 'versionstamp: String!'`,
      );
    }

    const tableName = type.ofType.name;

    // todo: instead check that arguments are exactly all fields, except `id`, and reference fields must be of type ID or [ID], also non null exactly like fields
    if (isIdArguments(mutation.args)) {
      throw new InvalidSchema(
        `Mutation '${mutationName}' must have arguments for all fields except 'id: ID!'`,
      );
    }

    resolvers[rootMutationName][mutationName] = async (
      _root,
      args,
    ): Promise<IFieldResolver<any, any>> => {
      const key = [tableName];

      let res: Deno.KvCommitResult | Deno.KvCommitError = { ok: false };

      while (!res.ok) {
        const entries = db.list({ prefix: key }, {
          limit: 1,
          reverse: true,
        });
        const entry = await entries.next();

        const value = entry.value;

        if (!value) {
          // todo: use positive bigint, also elsewhere?
          const newId = 1;

          res = await db.set(key, args);
        } else {
          const lastId = value.key.at(-1)! as string;
          // todo: use positive bigint, also elsewhere?
          const newId = Number(lastId) + 1;

          res = await db
            .atomic()
            .check(value)
            .set(key, args)
            .commit();
        }
      }

      return res;
    };
  }
}

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
function createQueryResolver(
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

/**
 * Create resolver for optional column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type nullable type
 * @param tableName table name
 * @param columnName column name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
function createResolverOptional(
  db: Deno.Kv,
  type: NullableTypes,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  if (isLeafType(type)) {
    createResolverSimpleOptional(db, type, tableName, resolvers, optional);
  } else if (isObjectType(type)) {
    createResolverReferenceSingleOptional(
      db,
      type,
      tableName,
      columnName,
      resolvers,
      optional,
    );
  } else if (isListType(type)) {
    const innerType = type.ofType;
    createResolverReferenceMultiple(
      db,
      innerType,
      tableName,
      columnName,
      resolvers,
      optional,
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
 * @param optional if result can be null
 */
function createResolverReferenceMultiple(
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

/**
 * Create resolver for optional simple column
 *
 * note: mutates resolvers object
 * @param db Deno KV database
 * @param type leaf type
 * @param tableName table name
 * @param resolvers resolvers
 * @param optional if result can be null
 */
function createResolverSimpleOptional(
  _db: Deno.Kv,
  _type: GraphQLLeafType,
  _tableName: string,
  _resolvers: IResolvers,
  _optional: boolean,
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
 * @param optional if result can be null
 */
function createResolverReferenceSingleOptional(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites id in field value to object
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const id = root[columnName];

    if (optional && id === undefined) {
      return null;
    }

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

  createQueryResolver(db, type, resolvers);
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
 * @param optionalList if result list can be null
 * @param optional if result can be null
 */
function createResolverReferenceMultipleOptional(
  db: Deno.Kv,
  type: GraphQLObjectType,
  tableName: string,
  columnName: string,
  resolvers: IResolvers,
  optionalList: boolean,
  optional: boolean,
): void {
  const referencedTableName = type.name;

  // overwrites array of ids in field value to array of objects
  resolvers[tableName][columnName] = async (
    root,
  ): Promise<IFieldResolver<any, any>> => {
    const ids = root[columnName];

    if (optionalList && ids === undefined) {
      return null;
    }

    if (!Array.isArray(ids)) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain array of ids but found '${
          JSON.stringify(ids)
        }'`,
      );
    }

    if (optional && ids.length == 0) {
      return [];
    }

    if (ids.length == 0) {
      throw new DatabaseCorruption(
        `Expected column '${columnName}' to contain at least one reference but found zero`,
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

  createQueryResolver(db, type, resolvers);
}
