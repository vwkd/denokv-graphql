import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

// todo: actually test that data is inserted

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: BookInput!): Result @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Shadows of Eternity" }) {
        id,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: {
        id: "1",
        versionstamp: "00000000000000010000",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

// todo: fix, needs to query refetch
Deno.test("autoincrementing id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: BookInput!): Result @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Whispers of the Forgotten" }) {
        id,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: {
        id: "2",
        versionstamp: "00000000000000020000",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad last id negative bigint", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: BookInput!): Result @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Shadows of Eternity" }) {
        id,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", -999n], {
      id: -999n,
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: null,
    },
    errors: [{
      message: "Expected table 'Book' last row id to be positive bigint",
      locations: [{ line: 3, column: 7 }],
      path: ["createBook"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad last id other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createBook(data: BookInput!): Result @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Shadows of Eternity" }) {
        id,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "999"], {
      id: "999n",
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: null,
    },
    errors: [{
      message: "Expected table 'Book' last row id to be positive bigint",
      locations: [{ line: 3, column: 7 }],
      path: ["createBook"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
