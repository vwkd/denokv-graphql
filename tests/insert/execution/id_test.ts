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

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }

    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }

    input BookInput {
      id: ID!,
      title: String,
    }
    
    type Result {
      versionstamp: String!
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
  const keyId = ["Book", "1", "id"];
  const keyTitle = ["Book", "1", "title"];
  await db.atomic()
    .set(keyId, "1")
    .set(keyTitle, "Shadows of Eternity")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      createTransaction: null,
    },
  };

  assertEquals(res, exp);

  const resDb = await db.getMany([keyId, keyTitle]);

  const expDb = [
    {
      key: keyId,
      value: "1",
      versionstamp: "00000000000000010000",
    },
    {
      key: keyTitle,
      value: "Shadows of Eternity",
      versionstamp: "00000000000000010000",
    },
  ];

  db.close();

  assertEquals(resDb, expDb);
});
