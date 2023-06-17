import { assertThrows } from "../deps.ts";
import { buildSchema } from "../src/main.ts";
import { InvalidSchema } from "../src/utils.ts";

Deno.test("id input", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    input BookInput {
      id: ID!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' must not have an 'id' column",
  );

  db.close();
});

Deno.test("extra id input", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    input BookInput {
      id: ID!
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' must have one column for each column of table 'Book' except the 'id' column",
  );

  db.close();
});

Deno.test("no argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook: Result! @insert(table: "Book")
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
    "Mutation 'createBook' must have single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("other argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(XXX: String): Result! @insert(table: "Book")
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
    "Mutation 'createBook' must have single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("extra argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!, XXX: String): Result! @insert(table: "Book")
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
    "Mutation 'createBook' must have single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("null type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result @insert(table: "Book")
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
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): String! @insert(table: "Book")
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
