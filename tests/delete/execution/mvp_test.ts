import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }

    input Identifier {
      id: ID!,
      versionstamp: String!
    }
    
    type Result {
      versionstamp: String!
    }
  `;

  const source = `
    mutation {
      deleteTransaction(data: {
        deleteBookById: [{ id: "1", versionstamp: "00000000000000010000" }]
      }) {
        versionstamp
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
      deleteTransaction: {
        versionstamp: "00000000000000020000",
      },
    },
  };

  assertEquals(res, exp);

  const resDb = await db.getMany([keyId, keyTitle]);

  const expDb = [
    {
      key: keyId,
      value: null,
      versionstamp: null,
    },
    {
      key: keyTitle,
      value: null,
      versionstamp: null,
    },
  ];

  db.close();

  assertEquals(resDb, expDb);
});
