import { assertEquals, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

Deno.test({ permissions: { read: true } }, async function book_simple() {
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

  const schemaSource = await Deno.readTextFile(
    "tests/book_simple_schema.graphql",
  );

  const schema = buildSchema(db, schemaSource);

  const source = await Deno.readTextFile("tests/book_simple_query.graphql");

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
