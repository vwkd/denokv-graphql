import { assertEquals, graphql } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
   type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
    }

    type BookResult {
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
        createBook: [{ id: "1", title: "Shadows of Eternity" }]
      }) {
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      createTransaction: {
        versionstamp: "00000000000000010000",
      },
    },
  };

  assertEquals(res, exp);

  const keyId = ["Book", "1", "id"];
  const keyTitle = ["Book", "1", "title"];
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
