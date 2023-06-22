import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("nullable", async () => {
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
      createBook: BookInput @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("non-null", async () => {
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
      createBook: BookInput! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("nullable list non-null", async () => {
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
      createBook: [BookInput!] @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("non-null list nullable", async () => {
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
      createBook: [BookInput]! @insert(table: "Book")
    }
    
    input BookInput {
      id: ID!,
      title: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("nullable other", async () => {
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
      createBook: String @insert(table: "Book")
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("non-null other", async () => {
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
      createBook: String! @insert(table: "Book")
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("nullable list non-null other", async () => {
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
      createBook: [String!] @insert(table: "Book")
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("non-null list nullable other", async () => {
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
      createBook: [String]! @insert(table: "Book")
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null list non-null input object type",
  );

  db.close();
});
