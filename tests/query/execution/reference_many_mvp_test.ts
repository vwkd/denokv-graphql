import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: [
            {
              id: "11",
              name: "Victoria Nightshade",
            },
            {
              id: "12",
              name: "Sebastian Duskwood",
            },
          ],
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});