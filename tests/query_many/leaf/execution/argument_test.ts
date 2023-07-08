import { assertObjectMatch, graphql } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";

Deno.test("first and before", async () => {
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
      books(first: 1, before: "foo") {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message:
        "Expected either 'first' with optional 'after' or 'last' with optional 'before'",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("last and after", async () => {
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
      books(first: 1, before: "foo") {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message:
        "Expected either 'first' with optional 'after' or 'last' with optional 'before'",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("first and last", async () => {
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
      books(first: 1, last: 1) {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message:
        "Expected either 'first' with optional 'after' or 'last' with optional 'before'",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("first and after and last", async () => {
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
      books(first: 1, after: "foo", last: 1) {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message:
        "Expected either 'first' with optional 'after' or 'last' with optional 'before'",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("first and last and before", async () => {
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
      books(first: 1, last: 1, before: "foo") {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message:
        "Expected either 'first' with optional 'after' or 'last' with optional 'before'",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("negative first", async () => {
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
      books(first: -1) {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message: "Expected 'first' to be non-negative integer",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("negative last", async () => {
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
      books(last: -1) {
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

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: null,
    errors: [{
      message: "Expected 'last' to be non-negative integer",
      locations: [{ line: 3, column: 7 }],
      path: ["books"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
