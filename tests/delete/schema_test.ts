import { assert, assertThrows } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";
import { InvalidSchema } from "../../src/utils.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  assert(schema);

  db.close();
});

Deno.test("argument - nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("argument - none", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction: Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("argument - other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(XXX: String): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("argument - extra", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!, XXX: String): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return single 'data' argument with non-null input object type",
  );

  db.close();
});

Deno.test("return type - non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result!
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});

Deno.test("return type - list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): [Result]
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});

Deno.test("return type - other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): String
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Transaction 'deleteTransaction' must return nullable 'object' type",
  );

  db.close();
});

Deno.test("input data - nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: Identifier @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: Identifier! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - nullable list non-null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!] @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - non-null list nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - nullable other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: String @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - non-null other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: String! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - nullable list non-null other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [String!] @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data - non-null list nullable other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [String]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have non-null list non-null input object type",
  );

  db.close();
});

Deno.test("input data table - insufficient columns", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have two fields",
  );

  db.close();
});

Deno.test("input data table - excess columns", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
      XXX: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have two fields",
  );

  db.close();
});

Deno.test("input data table - missing 'id' column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      XXX: ID!
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("input data table - missing 'versionstamp' column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!
      XXX: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("input data table - 'id' column nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("input data table - 'id' column list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: [ID]
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("input data table - 'id' column other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: String!
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'id' with non-null 'ID' type",
  );

  db.close();
});

Deno.test("input data table - 'versionstamp' column nullable", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!
      versionstamp: String
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("input data table - 'versionstamp' column list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!
      versionstamp: [String]
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("input data table - 'versionstamp' column other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "Book")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!
      versionstamp: Boolean!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' input table 'Identifier' must have field 'versionstamp' with non-null 'String' type",
  );

  db.close();
});

Deno.test("directive - none", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]!
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'deleteBookById' must have one 'insert' or 'delete' directive",
  );

  db.close();
});

// todo: delete when [#3912](https://github.com/graphql/graphql-js/issues/3912) is fixed
Deno.test("directive argument - other type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: 999)
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table '999' in mutation 'deleteBookById' doesn't exist",
  );

  db.close();
});

Deno.test("directive argument - no table", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' in mutation 'deleteBookById' doesn't exist",
  );

  db.close();
});

Deno.test("directive argument - no object type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    enum XXX {
      YYY
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' in mutation 'deleteBookById' must be an object type",
  );

  db.close();
});

Deno.test("directive table - missing id column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    type XXX {
      YYY: ID!,
      title: String,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' must have an 'id: ID!' column",
  );

  db.close();
});

Deno.test("directive table - missing second column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
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

    type XXX {
      id: ID!,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    type Result {
      versionstamp: String!
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Table 'XXX' must have at least two columns",
  );

  db.close();
});
