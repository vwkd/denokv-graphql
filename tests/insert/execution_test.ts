import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

// todo: actually test that data is inserted

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: [BookInput!]!): Result @insert(table: "Book")
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

    input BookInput {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: [{ id: "1", title: "Shadows of Eternity" }]) {
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      createBook: {
        versionstamp: "00000000000000010000",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

// todo: fix, needs to query refetch
Deno.test("existing id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: [BookInput!]!): Result @insert(table: "Book")
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

    input BookInput {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: [{ id: "1", title: "Whispers of the Forgotten" }]) {
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      createBook: null,
    },
    errors: [{
      message:
        "Mutation 'createBook' failed to insert rows into table 'Book' because some ids already exist",
      locations: [{ line: 3, column: 7 }],
      path: ["createBook"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
