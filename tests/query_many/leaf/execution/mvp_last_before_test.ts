import { assertEquals, graphql } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";

Deno.test("exact", async () => {
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
      books(last: 2, before: "AjMAAmlkAA==") {
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
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .set(["Book", "3", "id"], "3")
    .set(["Book", "3", "title"], "Crimson Veil")
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
                title: "Whispers of the Forgotten",
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("more", async () => {
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
      books(last: 3, before: "AjMAAmlkAA==") {
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
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .set(["Book", "3", "id"], "3")
    .set(["Book", "3", "title"], "Crimson Veil")
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
                title: "Whispers of the Forgotten",
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjEAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("fewer", async () => {
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
      books(last: 1, before: "AjMAAmlkAA==") {
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
    .set(["Book", "2", "title"], "Whispers of the Forgotten")
    .set(["Book", "3", "id"], "3")
    .set(["Book", "3", "title"], "Crimson Veil")
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
                title: "Whispers of the Forgotten",
              },
            },
            cursor: "AjIAAmlkAA==",
          },
        ],
        pageInfo: {
          startCursor: "AjIAAmlkAA==",
          endCursor: "AjIAAmlkAA==",
          hasNextPage: true,
          hasPreviousPage: true,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("exact empty", async () => {
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
      books(last: 2, before: "AjMAAmlkAA==") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("more empty", async () => {
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
      books(last: 3, before: "AjMAAmlkAA==") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("fewer empty", async () => {
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
      books(last: 1, before: "AjMAAmlkAA==") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("exact bad cursor", async () => {
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
      books(last: 2, before: "Zm9v") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("more bad cursor", async () => {
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
      books(last: 3, before: "Zm9v") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("fewer bad cursor", async () => {
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
      books(last: 1, before: "Zm9v") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("zero", async () => {
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
      books(last: 0, before: "AjMAAmlkAA==") {
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
    data: {
      books: {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
