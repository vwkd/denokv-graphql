import { assert, assertThrows } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";
import { InvalidSchema } from "../../src/utils.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
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

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("no argument", async () => {
  const schemaSource = `
    type Query {
      bookById: BookResult
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("other argument", async () => {
  const schemaSource = `
    type Query {
      bookById(XXX: ID!): BookResult
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("extra argument", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!, XXX: String): BookResult
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must have single 'id: ID!' argument",
  );

  db.close();
});

Deno.test("non-null return type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult!
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});

Deno.test("list return type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): [BookResult]
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

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});

Deno.test("no object return type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' must return nullable object type",
  );

  db.close();
});

Deno.test("missing id column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      XXX: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'Book' must have an 'id: ID!' column",
  );

  db.close();
});

Deno.test("missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'Book' must have at least two columns",
  );

  db.close();
});

Deno.test("return type missing fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have three fields",
  );

  db.close();
});

Deno.test("return type extra fields", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
      XXX: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have three fields",
  );

  db.close();
});

Deno.test("return type missing 'id'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      XXX: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("return type missing 'versionstamp'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      XXX: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("return type missing 'value'", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      XXX: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Query 'bookById' return type must have field 'value' with non-null object type",
  );

  db.close();
});

Deno.test("scalar list column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: [String],
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type '[String]'",
  );

  db.close();
});

Deno.test("scalar non-null list column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: [String]!,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type '[String]!'",
  );

  db.close();
});

Deno.test("non-null scalar list column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: [String!],
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type '[String!]'",
  );

  db.close();
});

Deno.test("non-null scalar non-null list column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: [String!]!,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type '[String!]!'",
  );

  db.close();
});

Deno.test("interface column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: Foo,
    }

    interface Foo {
      baz: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type 'Foo'",
  );

  db.close();
});

Deno.test("non-null interface column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: Foo!,
    }

    interface Foo {
      baz: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type 'Foo!'",
  );

  db.close();
});

Deno.test("union column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
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

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type 'Foo'",
  );

  db.close();
});

Deno.test("non-null union column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
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

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Column 'title' of table 'Book' has unexpected type 'Foo!'",
  );

  db.close();
});
