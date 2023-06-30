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
      authors(first: Int, after: ID, last: Int, before: ID): AuthorConnection!,
    }

    type AuthorConnection {
      edges: [AuthorEdge]!
      pageInfo: PageInfo!
    }

    type AuthorEdge {
      node: Author!
      cursor: ID!
    }

    type Author {
      id: ID!,
      name: String,
      books(first: Int, after: ID, last: Int, before: ID): BookConnection!,
    }

    type BookConnection {
      edges: [BookEdge]!
      pageInfo: PageInfo!
    }

    type BookEdge {
      node: Book!
      cursor: ID!
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
          authors(first: 2) {
            edges {
              node {
                id,
                name,
                books {
                  id,
                  title,
                }
              }
              cursor
            }
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .set(["Book", "1", "authors", "11"], undefined)
    .set(["Book", "1", "authors", "12"], undefined)
    .set(["Book", "2", "id"], "2")
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .set(["Book", "2", "authors", "11"], undefined)
    .set(["Book", "2", "authors", "12"], undefined)
    .commit();
  // todo: merge into previous call https://github.com/denoland/deploy_feedback/issues/418 is fixed
  await db.atomic()
    .set(["Author", "11", "id"], "11")
    .set(["Author", "11", "name"], "Victoria Nightshade")
    .set(["Author", "11", "books", "1"], undefined)
    .set(["Author", "11", "books", "2"], undefined)
    .set(["Author", "12", "id"], "12")
    .set(["Author", "12", "name"], "Sebastian Duskwood")
    .set(["Author", "12", "books", "1"], undefined)
    .set(["Author", "12", "books", "2"], undefined)
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
