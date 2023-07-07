import { assertEquals, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("null column exact", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: ID): BookConnection!
    }

    type BookConnection {
      edges: [BookEdge]!
      pageInfo: PageInfo!
    }

    type BookEdge {
      node: BookResult!
      cursor: ID!
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
      books(last: 2) {
        edges {
          node {
            versionstamp
            value {
              id
              title
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
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .set(["Book", "2", "id"], "2")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [
          {
            node: {
              versionstamp: "00000000000000010000",
              value: {
                id: "1",
                title: "Shadows of Eternity",
              },
            },
            cursor: "AjEAAmlkAA==",
          },
          {
            node: {
              versionstamp: "00000000000000010000",
              value: {
                id: "2",
                title: null,
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("null column more", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: ID): BookConnection!
    }

    type BookConnection {
      edges: [BookEdge]!
      pageInfo: PageInfo!
    }

    type BookEdge {
      node: BookResult!
      cursor: ID!
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
      books(last: 3) {
        edges {
          node {
            versionstamp
            value {
              id
              title
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
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .set(["Book", "2", "id"], "2")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [
          {
            node: {
              versionstamp: "00000000000000010000",
              value: {
                id: "1",
                title: "Shadows of Eternity",
              },
            },
            cursor: "AjEAAmlkAA==",
          },
          {
            node: {
              versionstamp: "00000000000000010000",
              value: {
                id: "2",
                title: null,
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("null column fewer", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: ID): BookConnection!
    }

    type BookConnection {
      edges: [BookEdge]!
      pageInfo: PageInfo!
    }

    type BookEdge {
      node: BookResult!
      cursor: ID!
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
      books(last: 1) {
        edges {
          node {
            versionstamp
            value {
              id
              title
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
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "1")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .set(["Book", "2", "id"], "2")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [
          {
            node: {
              versionstamp: "00000000000000010000",
              value: {
                id: "2",
                title: null,
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjIAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: false,
          hasPreviousPage: true,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
