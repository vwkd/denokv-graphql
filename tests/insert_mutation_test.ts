import { assertEquals, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

// todo: actually test that data is inserted

Deno.test("minimal working example", async () => {
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
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Shadows of Eternity" }) {
        ok,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: {
        ok: true,
        versionstamp: "00000000000000010000",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

// todo: fix, needs to query refetch
Deno.test("autoincrementing id", async () => {
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
    }

    input BookInput {
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(data: { title: "Whispers of the Forgotten" }) {
        ok,
        versionstamp,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: {
        ok: true,
        versionstamp: "00000000000000020000",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
