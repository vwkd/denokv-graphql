import { assertThrows } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

Deno.test("missing query root type", async () => {
  const schemaSource = `
    type Book {
      id: ID,
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
      bookById(id: ID): Book
    }

    type Book {
      XXX: ID,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Table 'Book' must have an 'id' column with type 'ID'",
  );

  db.close();
});

Deno.test("missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID): Book
    }

    type Book {
      id: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
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
      id: ID,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Query field 'bookById' must have single 'id: ID' argument",
  );

  db.close();
});

Deno.test("other argument", async () => {
  const schemaSource = `
    type Query {
      bookById(XXX: ID): Book
    }

    type Book {
      id: ID,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Query field 'bookById' must have single 'id: ID' argument",
  );

  db.close();
});

Deno.test("extra argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID, XXX: String): Book
    }

    type Book {
      id: ID,
      title: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Query field 'bookById' must have single 'id: ID' argument",
  );

  db.close();
});

Deno.test("no object type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID): String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    Error,
    "Query field 'bookById' has unexpected type 'String'",
  );

  db.close();
});
