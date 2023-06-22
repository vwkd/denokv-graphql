import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("missing id column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type XXX {
      YYY: ID!,
      title: String,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' must have an 'id: ID!' column",
  );

  db.close();
});

Deno.test("missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type XXX {
      id: ID!,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' must have at least two columns",
  );

  db.close();
});
