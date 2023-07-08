import { assertThrows } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";
import { InvalidSchema } from "../../../../src/utils.ts";

Deno.test("object list", async () => {
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
      title: [Foo],
    }

    type Foo {
      id: ID!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("object non-null list", async () => {
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
      title: [Foo]!,
    }

    type Foo {
      id: ID!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null object list", async () => {
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
      title: [Foo!],
    }

    type Foo {
      id: ID!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null object non-null list", async () => {
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
      title: [Foo!]!,
    }

    type Foo {
      bar: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("scalar list", async () => {
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
      title: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("scalar non-null list", async () => {
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
      title: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null scalar list", async () => {
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
      title: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null scalar non-null list", async () => {
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
      title: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("interface", async () => {
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
      title: Foo,
    }

    interface Foo {
      baz: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null interface", async () => {
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
      title: Foo!,
    }

    interface Foo {
      baz: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("union", async () => {
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
      title: Foo,
    }

    union Foo = Bar | Baz
  
    type Bar {
      bar: String,
    }

    type Baz {
      baz: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});

Deno.test("non-null union", async () => {
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
      title: Foo!,
    }

    union Foo = Bar | Baz
  
    type Bar {
      bar: String,
    }

    type Baz {
      baz: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' must be leaf or object type",
  );

  db.close();
});
