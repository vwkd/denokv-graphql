import { assert } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors(first: Int, after: ID, last: Int, before: ID): AuthorConnection!,
    }

    type AuthorConnection {
      edges: [AuthorEdge]!
      pageInfo: PageInfo!
    }

    type AuthorEdge {
      node: Author!
      cursor: ID!
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});
