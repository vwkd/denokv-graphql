import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("null column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
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

  const source = `
    query {
      bookById(id: "1") {
        versionstamp
        value {
          id,
          title,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: null,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
