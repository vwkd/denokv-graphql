import { assertThrows } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";
import { InvalidSchema } from "../../../src/utils.ts";

Deno.test("none", async () => {
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
      deleteBookById: [Identifier!]!
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
    "Mutation 'deleteBookById' must have one 'insert' or 'delete' directive",
  );

  db.close();
});
