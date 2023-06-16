import { assertThrows } from "../deps.ts";
import { buildSchema } from "../src/main.ts";
import { InvalidSchema } from "../src/utils.ts";

Deno.test("id argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(id: ID!, title: String): Result!
    }

    type Book {
      id: ID!,
      title: String,
    }

    type Result {
      ok: Boolean!,
      versionstamp: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must not have an 'id: ID!' argument",
  );

  db.close();
});

// todo: finish
Deno.test("no argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook: Result!
    }

    type Book {
      id: ID!,
      title: String,
    }

    type Result {
      ok: Boolean!,
      versionstamp: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have ??? argument",
  );

  db.close();
});

// todo: finish
Deno.test("other argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(XXX: String): Result!
    }

    type Book {
      id: ID!,
      title: String,
    }

    type Result {
      ok: Boolean!,
      versionstamp: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have ??? argument",
  );

  db.close();
});

// todo: finish
Deno.test("extra argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(title: String, XXX: String): Result!
    }

    type Book {
      id: ID!,
      title: String,
    }

    type Result {
      ok: Boolean!,
      versionstamp: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have ??? argument",
  );

  db.close();
});

Deno.test("null type", async () => {
  const schemaSource = `
    type Mutation {
      createBook(title: String, XXX: String): Result
    }

    type Book {
      id: ID!,
      title: String,
    }

    type Result {
      ok: Boolean!,
      versionstamp: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must return non-null object type with fields 'ok: Boolean!' and 'versionstamp: String!'",
  );

  db.close();
});

Deno.test("list type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): [Result] @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    input BookInput {
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must have non-null 'Result' type",
  );

  db.close();
});

Deno.test("other type", async () => {
  const schemaSource = `
    type Mutation {
      createBook(title: String, XXX: String): String
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' must return non-null object type with fields 'ok: Boolean!' and 'versionstamp: String!'",
  );

  db.close();
});
