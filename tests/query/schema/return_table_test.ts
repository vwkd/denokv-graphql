import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("missing fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have three fields",
  );

  db.close();
});

Deno.test("extra fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
      XXX: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have three fields",
  );

  db.close();
});

Deno.test("missing 'id'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      XXX: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("missing 'versionstamp'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      XXX: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("missing 'value'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      XXX: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'value' with non-null object type",
  );

  db.close();
});
