import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

// todo: delete when [#3912](https://github.com/graphql/graphql-js/issues/3912) is fixed
Deno.test("other type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: 999)
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }

    type Result {
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

Deno.test("no table", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }

    type Result {
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

Deno.test("no object type", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      deleteTransaction(data: DeleteInput!): Result
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }

    type Book {
      id: ID!,
      title: String,
    }

    enum XXX {
      YYY
    }

    input DeleteInput {
      deleteBookById: [Identifier!]! @delete(table: "XXX")
    }
    
    input Identifier {
      id: ID!,
      versionstamp: String!
    }

    type Result {
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
