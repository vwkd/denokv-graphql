import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput): Result
    }

    type BookResult {
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }

    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'createTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("none", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction: Result
    }

    type BookResult {
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }

    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'createTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(XXX: String): Result
    }

    type BookResult {
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }

    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'createTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("extra", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!, XXX: String): Result
    }

    type BookResult {
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }

    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'createTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});
