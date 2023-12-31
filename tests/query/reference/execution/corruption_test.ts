import { assertObjectMatch, graphql } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";

Deno.test("bad id", async () => {
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
    .set(["Book", "1", "author", "999"], undefined)
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
          author: null,
        },
      },
    },
    errors: [{
      message: "Expected table 'Author' to have row with id '999'",
      locations: [{ line: 9, column: 13 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("other reference", async () => {
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
    .set(["Author", "11"], "XXX")
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
          author: null,
        },
      },
    },
    errors: [{
      message: "Expected table 'Author' to have row with id '11'",
      locations: [{ line: 9, column: 13 }],
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
    .set(["Author", "11", "id"], "999")
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
          author: null,
        },
      },
    },
    errors: [{
      message:
        "Expected table 'Author' row '11' column 'id' to be equal to row id",
      locations: [{ line: 9, column: 13 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null", async () => {
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
      author: Author!,
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
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message: "Expected table 'Book' row '1' column 'author' to have one key",
      locations: [{ line: 8, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
