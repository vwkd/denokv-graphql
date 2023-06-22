import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult!
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
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});

Deno.test("list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): [BookResult]
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
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});

Deno.test("no object", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});
