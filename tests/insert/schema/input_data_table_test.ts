import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("insufficient columns", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      title: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' must have one column for each column of table 'Book'",
  );

  db.close();
});

Deno.test("excess columns", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
      XXX: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' must have one column for each column of table 'Book'",
  );

  db.close();
});

Deno.test("missing column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      XXX: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' must have a column 'title'",
  );

  db.close();
});

Deno.test("column type nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'id' must have same type as column in table 'Book'",
  );

  db.close();
});

Deno.test("column type list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: [ID]
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'id' must have same type as column in table 'Book'",
  );

  db.close();
});

Deno.test("column type other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    type Result {
      versionstamp: String!
    }
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    input BookInput {
      id: String!
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'id' must have same type as column in table 'Book'",
  );

  db.close();
});
