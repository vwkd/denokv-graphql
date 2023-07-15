/**
 * Basic example
 *
 * Run with `deno run --unstable --allow-read examples/basic/basic.ts`
 */
import { graphql } from "npm:graphql@16.6.0";
import { buildSchema } from "https://deno.land/x/denokv_graphql@$MODULE_VERSION/mod.ts";

const schemaSource = await Deno.readTextFile("./examples/basic/schema.graphql");
const source = await Deno.readTextFile("./examples/basic/operations.graphql");

const db = await Deno.openKv(":memory:");

const schema = buildSchema(db, schemaSource);

const authorId = "11";
const bookId = "1";

console.log(`--- Insert ---`);

const resultInsert = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { authorId, bookId },
  operationName: "writeBook",
});

console.log(JSON.stringify(resultInsert, null, 2));

const versionstamp = resultInsert.data.createTransaction.versionstamp;

console.log(`--- Read ---`);

const resultRead = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { bookId },
  operationName: "readBook",
});

console.log(JSON.stringify(resultRead, null, 2));

console.log(`--- Read many ---`);

const resultReads = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { first: 20 },
  operationName: "readBooks",
});

console.log(JSON.stringify(resultReads, null, 2));

console.log(`--- Delete ---`);

const resultDelete = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { authorId, bookId, versionstamp },
  operationName: "deleteBook",
});

console.log(JSON.stringify(resultDelete, null, 2));

db.close();
