import { assertEquals, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

Deno.test({ permissions: { read: true } }, async function book_simple() {
  const schemaSource = `
    type Query {
      bookById(id: ID): Book
    }

    type Book {
      id: ID,
      title: String,
      author: Author,
    }

    type Author {
      id: ID,
      name: String,
      book: Book,
    }
  `;

  const source = `
    query {
      bookById(id: 1) {
        id,
        title,
        author {
          id,
          name,
          book {
            id,
            title,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "foo",
      author: "9",
    })
    .set(["Author", "9"], {
      id: "9",
      name: "bar",
      book: "1",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "foo",
        author: {
          id: "9",
          name: "bar",
          book: {
            id: "1",
            title: "foo",
          },
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
