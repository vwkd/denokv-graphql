import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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

  const source = `
    mutation {
      deleteBookById(id: "1")
    }
  `;

  const db = await Deno.openKv(":memory:");
  const key = ["Book", "1"];
  await db.atomic()
    .set(key, {
      id: "1",
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
  };

  assertEquals(res, exp);

  const resDb = await db.get(key);

  const expDb = {
    key,
    value: null,
    versionstamp: null,
  };

  db.close();

  assertEquals(resDb, expDb);
});

Deno.test("null row", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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

  const source = `
    mutation {
      deleteBookById(id: "999")
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
  };

  db.close();

  assertEquals(res, exp);
});
