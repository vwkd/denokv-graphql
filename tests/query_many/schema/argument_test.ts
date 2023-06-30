import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("none", async () => {
  const schemaSource = `
    type Query {
      books: BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have four arguments",
  );

  db.close();
});

Deno.test("missing 3", async () => {
  const schemaSource = `
  type Query {
    books(XXX: Int): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have four arguments",
  );

  db.close();
});

Deno.test("missing 2", async () => {
  const schemaSource = `
  type Query {
    books(XXX: Int, YYY: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have four arguments",
  );

  db.close();
});

Deno.test("missing 1", async () => {
  const schemaSource = `
  type Query {
    books(XXX: Int, YYY: ID, ZZZZ: Int): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have four arguments",
  );

  db.close();
});

Deno.test("extra", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: ID, XXX: Int): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have four arguments",
  );

  db.close();
});

Deno.test("missing 'first'", async () => {
  const schemaSource = `
    type Query {
      books(XXX: Int, after: ID, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'first' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("missing 'after'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, XXX: ID, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'after' argument of nullable 'ID' type",
  );

  db.close();
});

Deno.test("missing 'last'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, XXX: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'last' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("missing 'before'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, XXX: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'before' argument of nullable 'ID' type",
  );

  db.close();
});

Deno.test("other 'first'", async () => {
  const schemaSource = `
    type Query {
      books(first: String, after: ID, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'first' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("other 'after'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: String, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'after' argument of nullable 'ID' type",
  );

  db.close();
});

Deno.test("other 'last'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: String, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'last' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("other 'before'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: String): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'before' argument of nullable 'ID' type",
  );

  db.close();
});

Deno.test("non-null 'first'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int!, after: ID, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'first' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("non-null 'after'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID!, last: Int, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'after' argument of nullable 'ID' type",
  );

  db.close();
});

Deno.test("non-null 'last'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int!, before: ID): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'last' argument of nullable 'Int' type",
  );

  db.close();
});

Deno.test("non-null 'before'", async () => {
  const schemaSource = `
    type Query {
      books(first: Int, after: ID, last: Int, before: ID!): BookConnection!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Field 'books' must have 'before' argument of nullable 'ID' type",
  );

  db.close();
});
