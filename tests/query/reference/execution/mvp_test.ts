import { assertEquals, graphql } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";

Deno.test("minimal working example", async () => {
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
      author: Author,
    }

    type Author {
      id: ID!,
      name: String,
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        versionstamp,
        value {
          id,
          title,
          author {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .set(["Book", "1", "author", "11"], undefined)
    .set(["Author", "11", "id"], "11")
    .set(["Author", "11", "name"], "Victoria Nightshade")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          author: {
            id: "11",
            name: "Victoria Nightshade",
          },
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
