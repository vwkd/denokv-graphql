import { assertObjectMatch, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("bad id", async () => {
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
    .set(["Book", "1", "authors", "998"], undefined)
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
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: {
            edges: [],
            pageInfo: {
              startCursor: "AjEyAA==",
              endCursor: "Ajk5OAA=",
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
    errors: [{
      message: "Expected table 'Author' to have row with id '998'",
      locations: [{ line: 12, column: 17 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad id in reference", async () => {
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
    .set(["Author", "11", "id"], "999")
    .set(["Author", "11", "name"], "Victoria Nightshade")
    .set(["Author", "12", "id"], "12")
    .set(["Author", "12", "name"], "Sebastian Duskwood")
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
          authors: {
            edges: [],
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
    errors: [{
      message:
        "Expected table 'Author' row '11' column 'id' to be equal to row id",
      locations: [{ line: 12, column: 17 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("empty list", async () => {
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
      edges: [AuthorEdge!]!
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
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' row '1' column 'authors' to contain at least one key",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad reference id", async () => {
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
    .set(["Book", "1", "authors", "999"], undefined)
    .set(["Author", "11", "id"], "11")
    .set(["Author", "11", "name"], "Victoria Nightshade")
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
          authors: {
            edges: [],
            pageInfo: {
              startCursor: "AjExAA==",
              endCursor: "Ajk5OQA=",
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
    errors: [{
      message: "Expected table 'Author' to have row with id '999'",
      locations: [{ line: 12, column: 17 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
