import { assertObjectMatch, graphql } from "../../../deps.ts";
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
      title: String!,
    }
  `;

  const source = `
    query {
      books(first: 2) {
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
    .set(["Book", "2", "id"], "2")
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
    errors: [{
      message: "Expected table 'Book' row '1' column 'title' to be non-empty",
      locations: [{ line: 9, column: 15 }],
      path: ["books", "edges", 0, "node", "value", "title"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
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
      title: String!,
    }
  `;

  const source = `
    query {
      books(first: 3) {
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
    .set(["Book", "2", "id"], "2")
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
    errors: [{
      message: "Expected table 'Book' row '1' column 'title' to be non-empty",
      locations: [{ line: 9, column: 15 }],
      path: ["books", "edges", 0, "node", "value", "title"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
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
      title: String!,
    }
  `;

  const source = `
    query {
      books(first: 1) {
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
    .set(["Book", "2", "id"], "2")
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjEAAmlkAA==",
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
    errors: [{
      message: "Expected table 'Book' row '1' column 'title' to be non-empty",
      locations: [{ line: 9, column: 15 }],
      path: ["books", "edges", 0, "node", "value", "title"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
