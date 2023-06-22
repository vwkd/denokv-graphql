import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result!
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
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
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});

Deno.test("list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): [Result]
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
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
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});

Deno.test("other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): String
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
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
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});
