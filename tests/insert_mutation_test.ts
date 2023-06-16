import { assertEquals, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

// todo: actually test that data is inserted

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(title: String): Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(title: "Shadows of Eternity") {
        id,
        title,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      createBook: {
        id: "1",
        title: "Shadows of Eternity",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("autoincrementing id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Mutation {
      createBook(title: String): Book!
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    mutation {
      createBook(title: "Whispers of the Forgotten") {
        id,
        title,
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
        id: "2",
        title: "Whispers of the Forgotten",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
