import { graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

const source1 = await Deno.readTextFile("tests/schema1.graphql");

const schema = buildSchema(source1);

const source = await Deno.readTextFile("tests/query1.graphql");

const gql = await graphql({ schema, source });

console.log(JSON.stringify(gql, null, 2));
