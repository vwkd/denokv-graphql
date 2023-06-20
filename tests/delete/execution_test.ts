import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

// todo: actually test that data is deleted

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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
  `;

  const source = `
    mutation {
      deleteBookById(id: "1")
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("null row", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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
  `;

  const source = `
    mutation {
      deleteBookById(id: "999")
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad id argument other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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
  `;

  const source = `
    mutation {
      deleteBookById(id: "XXX")
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' argument 'id' to contain bigint as string",
      locations: [{ line: 3, column: 7 }],
      path: ["deleteBookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad id argument negative bigint", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteBookById(id: ID!): Void @delete(table: "Book")
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
  `;

  const source = `
    mutation {
      deleteBookById(id: "-999")
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      deleteBookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' argument 'id' to contain positive bigint as string",
      locations: [{ line: 3, column: 7 }],
      path: ["deleteBookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
