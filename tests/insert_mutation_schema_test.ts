import { assertThrows } from "../deps.ts";
import { buildSchema } from "../src/main.ts";
import { InvalidSchema } from "../src/utils.ts";

Deno.test("id argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(id: ID!): Book!
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
    "Mutation 'createBook' must not have an 'id: ID!' argument",
  );

  db.close();
});

Deno.test("extra id argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(id: ID!, title: String): Book!
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
    "Mutation 'createBook' must have one argument for each column of table 'Book' except the 'id: ID!' column",
  );

  db.close();
});

Deno.test("no argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook: Book!
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
    "Mutation 'createBook' must have one argument for each column of table 'Book' except the 'id: ID!' column",
  );

  db.close();
});

Deno.test("other argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(XXX: String): Book!
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
    "Mutation 'createBook' must have a matching argument for each column of table 'Book' except the 'id: ID!' column",
  );

  db.close();
});

Deno.test("extra argument", async () => {
  const schemaSource = `
    type Mutation {
      createBook(title: String, XXX: String): Book!
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
    "Mutation 'createBook' must have one argument for each column of table 'Book' except the 'id: ID!' column",
  );

  db.close();
});

Deno.test("null type", async () => {
  const schemaSource = `
    type Mutation {
      createBook(title: String, XXX: String): Book
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
    "Mutation 'createBook' must have non-null object type",
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
    "Mutation 'createBook' must have non-null object type",
  );

  db.close();
});
