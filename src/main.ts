import { addResolversToSchema, buildASTSchema, Kind, parse } from "../deps.ts";
import type {
  DocumentNode,
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
  // todo: maybe expose options?
  const schemaAst = parse(source);

  // note: call before `generateResolvers(schemaAst)` because it validates schema
  const schema = buildASTSchema(schemaAst);

  const resolvers = generateResolvers(db, schemaAst);

  const schemaNew = addResolversToSchema({ schema, resolvers });

  return schemaNew;
}

/**
 * Generate the resolvers for Deno KV
 * @param db Deno KV database
 * @param schemaAst parsed schema document
 * @returns resolvers for Deno KV
 */
// todo: handle invalid schema
// todo: replace placeholder
function generateResolvers<TContext = any>(
  db: Deno.Kv,
  schemaAst: DocumentNode,
): IResolvers {
  const resolvers = {};

  // for table
  for (const definition of schemaAst.definitions) {
    if (definition.kind !== Kind.OBJECT_TYPE_DEFINITION) {
      throw new Error(`Unrecognized definition kind '${definition.kind}'`);
    }

    const tableName = definition.name.value;

    // todo: validate `id: ID!` field and at least one custom column
    if (!definition.fields) {
      throw new Error(`Table '${tableName}' must have at least one column.`);
    }

    // todo: handle id column, e.g. `if (columnName == "id" && type.name.value == "ID")`

    resolvers[tableName] = {};

    // for column
    for (const field of definition.fields) {
      const columnName = field.name.value;

      switch (field.type.kind) {
        case Kind.NAMED_TYPE: {
          // todo: handle either primitive type or object type
          // todo: handle non-null type

          // primitive type, simple column
          if (
            field.type.name.value == "String" | field.type.name.value == "ID"
          ) {
            // noop, use default resolver

            // object type, reference column
          } else {
            const referencedTableName = field.type.name.value;

            // todo: handle missing `id` argument and other argument
            // todo: handle other args than `id`, what if isn't named `id`?
            if (field.arguments?.length) {
              resolvers[tableName][columnName] = async (root, args) => {
                const id = args.id;
                const res = await db.get([referencedTableName, id]);
                return res.value;
              };
            } else {
              // overwrites value in field from id to object
              resolvers[tableName][columnName] = async (root, args) => {
                const id = root[columnName];
                const res = await db.get([referencedTableName, id]);
                return res.value;
              };
            }
          }
          break;
        }
        // todo: handle list type
        case Kind.LIST_TYPE: {
          // must be object type, must not be primitive type
          // todo: handle non-null type
          throw new Error("not implemented");
          break;
        }
        // todo: handle non-null type
        case Kind.NON_NULL_TYPE: {
          throw new Error("not implemented");
          break;
        }
      }

      // todo: get from above
      const key = [tableName, columnName];
    }
  }

  return resolvers;
}
