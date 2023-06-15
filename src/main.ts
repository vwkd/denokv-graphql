import {
  addResolversToSchema,
  buildASTSchema,
  isLeafType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  parse,
} from "../deps.ts";
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLObjectType,
  GraphQLSchema,
  IFieldResolver,
  IResolvers,
  Source,
} from "../deps.ts";

/**
 * Build a GraphQLSchema for Deno KV
 * @param db Deno KV database
 * @param source schema source document
 * @returns an executable schema for Deno KV
 */
export function buildSchema(
  db: Deno.Kv,
  source: string | Source,
): GraphQLSchema {
  const schemaAst = parse(source);

  // note: validates schema
  const schema = buildASTSchema(schemaAst);

  const resolvers = generateResolvers(db, schema);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  return schemaNew;
}

/**
 * Generate the resolvers for Deno KV
 * @param db Deno KV database
 * @param schema schema object
 * @returns resolvers for Deno KV
 */
function generateResolvers(
  db: Deno.Kv,
  schema: GraphQLSchema,
): IResolvers {
  const resolvers: IResolvers = {};

  // todo: handle other root types
  const queryObject = schema.getQueryType();

  if (!queryObject) {
    throw new Error(`Schema must have a root query type`);
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
      throw new Error(
        `Query field '${fieldName}' has unexpected type '${type}'`,
      );
    }

    const tableName = type.name;

    if (!isIdArguments(table.args)) {
      throw new Error(
        `Query field '${fieldName}' must have single 'id: ID' argument`,
      );
    }

    resolvers[queryName][fieldName] = async (
      root,
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
    throw new Error(`Table '${tableName}' must have at least two columns`);
  }

  if (!columns.some(isIdField)) {
    throw new Error(
      `Table '${tableName}' must have an 'id' column with type 'ID'`,
    );
  }

  for (const column of columns) {
    const columnName = column.name;
    const type = column.type;

    if (isLeafType(type)) {
      // simple column
      // noop, use default resolver
    } else if (isObjectType(type)) {
      // reference column, single
      // todo: handle non-null type

      const referencedTableName = type.name;

      // overwrites id in field value to object
      resolvers[tableName][columnName] = async (
        root,
        args,
      ): Promise<IFieldResolver<any, any>> => {
        const id = root[columnName];

        if (id === undefined) {
          throw new Error(
            `Database corruption. Expected column '${columnName}' to contain id but found '${
              JSON.stringify(id)
            }'`,
          );
        }

        const key = [referencedTableName, id];

        const entry = await db.get(key);

        if (entry.value === null) {
          throw new Error(
            `Database corruption. Referenced table '${referencedTableName}' has no row with id '${id}'`,
          );
        }

        return entry.value;
      };

      // recursively walk tree to create resolvers
      createResolver(db, type, resolvers);
    } else if (isListType(type)) {
      // reference column, multiple
      // todo: handle non-null type

      const innerType = type.ofType;

      if (isObjectType(innerType)) {
        const referencedTableName = innerType.name;

        // overwrites array of ids in field value to array of objects
        resolvers[tableName][columnName] = async (
          root,
          args,
        ): Promise<IFieldResolver<any, any>> => {
          const ids = root[columnName];

          if (!Array.isArray(ids)) {
            throw new Error(
              `Database corruption. Expected column '${columnName}' to contain array of ids but found '${
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
            throw new Error(
              `Database corruption. Referenced table '${referencedTableName}' has no row${
                missing_ids.length > 1 ? "s" : ""
              } with id${missing_ids.length > 1 ? "s" : ""} '${
                missing_ids.join("', '")
              }'`,
            );
          }

          return values;
        };

        // recursively walk tree to create resolvers
        createResolver(db, innerType, resolvers);
      } else {
        throw new Error(`Column '${columnName}' has unexpected type '${type}'`);
      }
    } else if (isNonNullType(type)) {
      throw new Error(`todo: not implemented`);
    } else {
      throw new Error(`Column '${columnName}' has unexpected type '${type}'`);
    }
  }
}

/**
 * Test if field is a `id: ID` field
 * @param field field
 * @returns boolean
 */
// todo: change to `ID!`, also above where called in error message
function isIdField(field: GraphQLField<any, any>): boolean {
  return field.name == "id" && isScalarType(field.type) &&
    field.type.name == "ID";
}

/**
 * Test if arguments contain single `id: ID` argument
 * @param args arguments
 * @returns boolean
 */
// todo: change to `ID!`, also above where called in error message
function isIdArguments(args: readonly GraphQLArgument[]): boolean {
  return args.length == 1 && args[0].name == "id" &&
    isScalarType(args[0].type) && args[0].type.name == "ID";
}
