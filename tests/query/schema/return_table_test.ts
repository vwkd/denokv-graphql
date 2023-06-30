import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("missing fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type BookResult {
      value: Book!
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
    "Query 'bookById' return type must have two fields",
  );

  db.close();
});

Deno.test("extra fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type BookResult {
      versionstamp: String!
      value: Book!
      XXX: String
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
    "Query 'bookById' return type must have two fields",
  );

  db.close();
});

Deno.test("missing 'versionstamp'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type BookResult {
      XXX: String!
      value: Book!
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
    "Query 'bookById' return type must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("missing 'value'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type BookResult {
      versionstamp: String!
      XXX: Book!
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
    "Query 'bookById' return type must have field 'value' with non-null object type",
  );

  db.close();
});
