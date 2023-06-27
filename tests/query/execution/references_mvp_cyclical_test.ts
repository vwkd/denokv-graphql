import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("minimal cyclical reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
      books: [Book],
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
            books {
              id,
              title,
            }
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
    .set(["Book", "2"], {
      id: "2",
      title: "Whispers of the Forgotten",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
      books: ["1", "2"],
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
      books: ["1", "2"],
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
              books: [
                {
                  id: "1",
                  title: "Shadows of Eternity",
                },
                {
                  id: "2",
                  title: "Whispers of the Forgotten",
                },
              ],
            },
            {
              id: "12",
              name: "Sebastian Duskwood",
              books: [
                {
                  id: "1",
                  title: "Shadows of Eternity",
                },
                {
                  id: "2",
                  title: "Whispers of the Forgotten",
                },
              ],
            },
          ],
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
