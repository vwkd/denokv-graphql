/**
 * API client example
 *
 * Run with `deno run --unstable --allow-read --allow-net examples/API/client.ts`
 */
const SERVER_URL = "http://localhost:8000/graphql";

const source = await Deno.readTextFile("./examples/basic/operations.graphql");

async function run(variables: Record<string, string>, operationName: string) {
  return fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: source,
      variables,
      operationName,
    }),
  });
}

const authorId = "11";
const bookId = "1";

console.log(`--- Insert ---`);

const insertResponse = await run({ authorId, bookId }, "writeBook");

const insertResult = JSON.parse(await insertResponse.json());

console.log(JSON.stringify(insertResult, null, 2));

const versionstamp = insertResult.data.createTransaction.versionstamp;

console.log(`--- Read ---`);

const readResponse = await run({ bookId }, "readBook");

const readResult = JSON.parse(await readResponse.json());

console.log(JSON.stringify(readResult, null, 2));

console.log(`--- Read many ---`);

const readsResponse = await run({ first: 20 }, "readBooks");

const readsResult = JSON.parse(await readsResponse.json());

console.log(JSON.stringify(readsResult, null, 2));

console.log(`--- Delete ---`);

const deleteResponse = await run(
  { authorId, bookId, versionstamp },
  "deleteBook",
);

const deleteResult = JSON.parse(await deleteResponse.json());

console.log(JSON.stringify(deleteResult, null, 2));
