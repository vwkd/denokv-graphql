import { Kind, makeExecutableSchema, parse } from "../deps.ts";
import type {
  BuildSchemaOptions,
  DocumentNode,
  GraphQLSchema,
  IResolvers,
  ParseOptions,
  Source,
} from "../deps.ts";

/**
 * Build a GraphQLSchema for Deno KV
 * @param source schema source document
 * @param options options
 * @returns an executable schema for Deno KV
 */
export function buildSchema(
  source: string | Source,
  options?: BuildSchemaOptions & ParseOptions,
): GraphQLSchema {
  const schemaAst = parse(source, {
    noLocation: options?.noLocation,
    allowLegacyFragmentVariables: options?.allowLegacyFragmentVariables,
  });

  const resolvers = generateResolvers(schemaAst);

  const schema = makeExecutableSchema({ typeDefs: source, resolvers });

  return schema;
}

/**
 * Generate the resolvers for Deno KV
 * @param schemaAst parsed schema document
 * @returns resolvers for Deno KV
 */
// todo: handle invalid schema
// todo: replace placeholder
function generateResolvers<TContext = any>(
  schemaAst: DocumentNode,
): IResolvers<any, TContext> | Array<IResolvers<any, TContext>> {
  /*
  for (const definition of schemaAst.definitions) {
    definition.kind
    if (definition.kind !== Kind.OBJECT_TYPE_DEFINITION) {
      throw new Error(`definition has unrecognized kind '${definition.kind}'`);
    }

    const tableName = definition.name.value;
    const columns = definition.fields;

    // todo: ... do something
  }
  */

  // ... placeholder
  const getBookById = (id: number) => ({ id, name: "foo" });

  const resolvers = {
    Query: {
      bookById: (root, args, context, info) => {
        return getBookById(args.id);
      },
    },
  };

  return resolvers;
}
