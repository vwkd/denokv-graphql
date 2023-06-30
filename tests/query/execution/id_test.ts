import { assertObjectMatch, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("bad id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1", "id"], "999")
    .set(["Book", "1", "title"], "Shadows of Eternity")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' row '1' column 'id' to be equal to row id",
      locations: [{ line: 7, column: 11 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
