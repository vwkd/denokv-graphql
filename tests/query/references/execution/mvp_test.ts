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
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        versionstamp,
        value {
          id,
          title,
          authors(first: 2) {
            edges {
              node {
                id,
                name,
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
    .set(["Author", "11", "id"], "11")
    .set(["Author", "11", "name"], "Victoria Nightshade")
    .set(["Author", "12", "id"], "12")
    .set(["Author", "12", "name"], "Sebastian Duskwood")
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
          authors: {
            edges: [
              {
                node: {
                  id: "11",
                  name: "Victoria Nightshade",
                },
                cursor: "AjExAA==",
              },
              {
                node: {
                  id: "12",
                  name: "Sebastian Duskwood",
                },
                cursor: "AjEyAA==",
              },
            ],
            pageInfo: {
              startCursor: "AjExAA==",
              endCursor: "AjEyAA==",
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
