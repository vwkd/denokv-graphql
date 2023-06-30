import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("none", async () => {
  const schemaSource = `
    type Query {
      bookById: BookResult
    }

    type BookResult {
      versionstamp: String!
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
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("other", async () => {
  const schemaSource = `
    type Query {
      bookById(XXX: ID!): BookResult
    }

    type BookResult {
      versionstamp: String!
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
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("extra", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!, XXX: String): BookResult
    }

    type BookResult {
      versionstamp: String!
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
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});
