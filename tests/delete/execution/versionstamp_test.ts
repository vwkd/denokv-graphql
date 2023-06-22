import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("bad versionstamp", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const source = `
    mutation {
      deleteTransaction(data: {
        deleteBookById: [{ id: "1", versionstamp: "00000000000000099999" }]
      }) {
        versionstamp
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
      deleteTransaction: null,
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