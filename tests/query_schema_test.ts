import { assertThrows } from "../deps.ts";
import { buildSchema } from "../src/main.ts";
import { InvalidSchema } from "../src/utils.ts";

Deno.test("missing query root type", async () => {
  const schemaSource = `
    type Book {
      id: ID!,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Schema must have a root query type",
  );

  db.close();
});

Deno.test("missing id column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      XXX: ID!,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'Book' must have an 'id: ID!' column",
  );

  db.close();
});

Deno.test("missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'Book' must have at least two columns",
  );

  db.close();
});

Deno.test("no argument", async () => {
  const schemaSource = `
    type Query {
      bookById: Book
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
    "Query field 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("other argument", async () => {
  const schemaSource = `
    type Query {
      bookById(XXX: ID!): Book
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
    "Query field 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("extra argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!, XXX: String): Book
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
    "Query field 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("non-null type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book!
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
    "Query field 'bookById' has unexpected type 'Book!'",
  );

  db.close();
});

Deno.test("list type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): [Book]
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
    "Query field 'bookById' has unexpected type '[Book]'",
  );

  db.close();
});

Deno.test("no object type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query field 'bookById' has unexpected type 'String'",
  );

  db.close();
});
