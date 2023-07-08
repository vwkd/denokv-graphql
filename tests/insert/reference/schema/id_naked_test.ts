import { assert, assertThrows } from "../../../../deps.ts";
import { buildSchema } from "../../../../src/main.ts";
import { InvalidSchema } from "../../../../src/utils.ts";

Deno.test("naked vs naked", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }

    input BookInput {
      id: ID!,
      title: String,
      author: ID,
    }

    type Result {
      versionstamp: String!
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
      bookById(id: ID!): BookResult
    }

    type Mutation {
      createTransaction(data: CreateInput!): Result
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
    
    input CreateInput {
      createBook: [BookInput!]! @insert(table: "Book")
    }

    input BookInput {
      id: ID!,
      title: String,
      author: ID,
    }

    type Result {
      versionstamp: String!
    }
  `;

  const db = await Deno.openKv(":memory:");

  assertThrows(
    () => buildSchema(db, schemaSource),
    InvalidSchema,
    "Mutation 'createBook' input table 'BookInput' column 'author' must have same type as column in table 'Book' as 'ID'",
  );

  db.close();
});
