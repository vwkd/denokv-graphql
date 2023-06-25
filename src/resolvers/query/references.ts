import {
GraphQLArgument,
  GraphQLObjectType,
  IFieldResolver,
  IMiddleware,
  IResolvers,
isNonNullType,
} from "../../../deps.ts";
import { ConcurrentChange, DatabaseCorruption } from "../../utils.ts";
import { createResolver } from "./main.ts";
import { validateQueryConnection, validateReferencedRow, validateReferencesArgumentInputs, validateReferencesArguments } from "./utils.ts";

/**
 * Create resolver for references field
 *
 * - note: mutates resolvers and middleware object
 * @param db Deno KV database
 * @param type field type
 * @param args field arguments
 * @param name field name
 * @param tableName table name
 * @param resolvers resolvers
 * @param middleware middleware
 */
// todo: allow non-null edge `[BookEdge!]!` in addition to nullable and handle accordingly if optional or not
export function createReferencesResolver(
  db: Deno.Kv,
  type: GraphQLObjectType,
  args: readonly GraphQLArgument[],
  name: string,
  tableName: string,
  resolvers: IResolvers,
  middleware: IMiddleware,
): void {
  // todo: replace with `validateConnection` with table type instead of result type of table type in 'node'
  validateQueryConnection(type);

  // note: asserted in `validateConnection`
  const fieldsConnection = type.getFields();
  let edge = fieldsConnection["edges"].type.ofType.ofType;

  let optional = true;
  if (isNonNullType(edge)) {
    edge = edge.ofType;
    optional = false;
  }

  const fieldsEdge = edge.getFields();
  const node = fieldsEdge["node"].type.ofType;
  const fields = node.getFields();
  const tableType = fields["value"].type.ofType;

  const referencedTableName = tableType.name;

  validateReferencesArguments(args, name);

  // overwrites array of ids in field value to array of objects
  const resolver: IFieldResolver<any, any> = async (
    root,
    _args,
    context,
  ) => {
    const first = args.first as number | undefined;
    const after = args.after as string | undefined;

    const last = args.last as number | undefined;
    const before = args.before as string | undefined;

    validateReferencesArgumentInputs(first, after, last, before);

    const ids = root[name];

    if (!Array.isArray(ids)) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${name}' to contain array`,
      );
    }

    if (ids.some((id) => !(typeof id == "string"))) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${name}' to contain array of strings`,
      );
    }

    if (optional && ids.length == 0) {
      const edges = [];

      const pageInfo = {
        hasPreviousPage: false,
        hasNextPage: false,
      }

      const connection = {
        edges,
        pageInfo
      }

      return connection;
    }

    if (ids.length == 0) {
      throw new DatabaseCorruption(
        `Expected table '${tableName}' column '${name}' to contain at least one reference`,
      );
    }

    const checks = context.checks;

    // todo: should delete this intermediate check and instead just do final one in root_middleware?
    let res = await db.atomic()
      .check(...checks)
      .commit();

    if (!res.ok) {
      throw new ConcurrentChange(
        `Detected concurrent change in some of the read rows. Try request again.`,
      );
    }

    // todo: actually do pagination
    // todo: what is cursor?
    if (first) {
      const keys = ids.map((id) => [referencedTableName, id]);

      const entries = await db.getMany(keys);

      const edges = entries.map(({ key, value, versionstamp }) => {
        // note: throw on first invalid entry instead of continuing to find all
        const id = key.at(-1)!;

        validateReferencedRow(value, referencedTableName, id);

        checks.push({ key, versionstamp });

        return value;
      });

      const pageInfo = {
        startCursor: "foo",
        endCursor: "foo",
        hasPreviousPage: false,
        hasNextPage: false,
      }

      const connection = {
        edges,
        pageInfo
      }

      return connection;
    } else if (last) {
      const keys = ids.map((id) => [referencedTableName, id]);

      const entries = await db.getMany(keys);

      const edges = entries.map(({ key, value, versionstamp }) => {
        // note: throw on first invalid entry instead of continuing to find all
        const id = key.at(-1)!;

        validateReferencedRow(value, referencedTableName, id);

        checks.push({ key, versionstamp });

        return value;
      });

      const pageInfo = {
        startCursor: "foo",
        endCursor: "foo",
        hasPreviousPage: false,
        hasNextPage: false,
      }

      const connection = {
        edges,
        pageInfo
      }

      return connection;
    } else {
      throw new Error(`should be unreachable`);
    }
  };

  resolvers[tableName][name] = resolver;

  createResolver(db, tableType, resolvers, middleware);
}
