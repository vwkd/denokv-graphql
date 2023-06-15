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
    throw new Error(`Couldn't find query type in schema`);
  }

  const queryName = queryObject.name;

  resolvers[queryName] = {};

  // an object type is a table, validate below
  const tables = queryObject.getFields();

  for (const table of Object.values(tables)) {
    const fieldName = table.name;
    const type = table.type;

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

    // todo: how to use `id` argument?
    resolvers[queryName][fieldName] = async (root, args) => {
      const id = args.id;
      const res = await db.get([tableName, id]);
      return res.value;
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
    console.debug(
      `Skipping resolvers for table '${tableName}' because already exist`,
    );
    return;
  } else {
    console.debug(`Creating resolvers for table '${tableName}'`);
  }

  resolvers[tableName] = {};

  // a field is a column
  // simple if scalar type or table reference if another object type
  const columns = Object.values(table.getFields());

  if (!(columns && columns.length > 1)) {
    throw new Error(`Table '${tableName}' must have at least two columns.`);
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
      // reference column
      // todo: handle non-null type

      const referencedTableName = type.name;

      // overwrites id in field value to object
      resolvers[tableName][columnName] = async (root, args) => {
        const id = root[columnName];

        const res = await db.get([referencedTableName, id]);
        return res.value;
      };

      // recursively walk tree to create resolvers
      createResolver(db, type, resolvers);
    } else if (isListType(type)) {
      // must contains object type, not leaf type
      // todo: handle non-null type
      throw new Error(`todo: not implemented`);
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
