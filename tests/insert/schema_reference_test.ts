import { assert, assertThrows } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";
import { InvalidSchema } from "../../src/utils.ts";

/**
 * Tests different combinations of reference column input type and table column type
 *
 * 6 * 6 = 36 possible combinations to combine `T`, `T!`, `[T]`, `[T!]`, `[T]!`, `[T!]!`
 */

/**
 * ---------- Section 1 ----------
 *
 * ID type
 */

/**
 * ---------- Group 1 ----------x
 *
 * naked vs X
 */

Deno.test("naked vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("naked vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 2 ----------
 *
 * non-null vs X
 */

Deno.test("non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: ID!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 3 ----------
 *
 * list vs X
 */

Deno.test("list vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("list vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 4 ----------
 *
 * list non-null vs X
 */

Deno.test("list non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("list non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 5 ----------
 *
 * non-null list vs X
 */

Deno.test("non-null list vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("non-null list vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 6 ----------
 *
 * non-null list non-null vs X
 */

Deno.test("non-null list non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [ID!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

/**
 * ---------- Section 2 ----------
 *
 * other type
 */

/**
 * ---------- Group 1 ----------
 *
 * naked vs X
 */

Deno.test("naked vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("naked vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 2 ----------
 *
 * non-null vs X
 */

Deno.test("non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: String!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 3 ----------
 *
 * list vs X
 */

Deno.test("list vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 4 ----------
 *
 * list non-null vs X
 */

Deno.test("list non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("list non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 5 ----------
 *
 * non-null list vs X
 */

Deno.test("non-null list vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!],
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

/**
 * ---------- Group 6 ----------
 *
 * non-null list non-null vs X
 */

Deno.test("non-null list non-null vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
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

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});

Deno.test("non-null list non-null vs non-null list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(data: BookInput!): Result! @insert(table: "Book")
    }

    type Book {
      id: ID!,
      title: String,
      author: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    input BookInput {
      title: String,
      author: [String!]!,
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' except as 'ID'",
  );

  db.close();
});
