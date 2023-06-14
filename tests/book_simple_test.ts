import { graphql, assertEquals } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

Deno.test({ permissions: { read: true }}, async function book_simple() {
  const source1 = await Deno.readTextFile("tests/book_simple_schema.graphql");

  const schema = buildSchema(source1);
  
  const source = await Deno.readTextFile("tests/book_simple_query.graphql");
  
  const res = await graphql({ schema, source });
  
  const exp = {
    data: {
      bookById: {
        id: "1",
        name: "foo"
      }
    }
  };

  assertEquals(res, exp);
})
