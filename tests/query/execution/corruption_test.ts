import { assertObjectMatch, graphql } from "../../../deps.ts";
import { buildSchema } from "../../../src/main.ts";

Deno.test("bad row", async () => {
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
        versionstamp
        value {
          id,
          title,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], "XXX")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message: "Expected table 'Book' row '1' to be an object",
      locations: [{ line: 3, column: 7 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
