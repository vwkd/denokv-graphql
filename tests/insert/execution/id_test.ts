import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("existing id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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

    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }

    input BookInput {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    mutation {
      createTransaction(data: {
        createBook: [{ id: "1", title: "Whispers of the Forgotten" }]
      }) {
        versionstamp,
      }
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
      createTransaction: null,
    },
  };

  assertEquals(res, exp);

  const resDb = await db.get(key);

  const expDb = {
    key,
    value: { id: "1", title: "Shadows of Eternity" },
    versionstamp: "00000000000000010000",
  };

  db.close();

  assertEquals(resDb, expDb);
});
