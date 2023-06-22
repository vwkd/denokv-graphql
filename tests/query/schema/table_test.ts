import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("missing id column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      XXX: ID!,
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
    "Table 'Book' must have an 'id: ID!' column",
  );

  db.close();
});

Deno.test("missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
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
    "Table 'Book' must have at least two columns",
  );

  db.close();
});
