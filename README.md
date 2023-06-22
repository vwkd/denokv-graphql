# README

GraphQL bindings for Deno KV



## Introduction

The library exposes a single `buildSchema` function that takes a GraphQL IDL schema string and a Deno KV database and returns an executable GraphQL schema. It expects a relational schema with tables and rows and sets up the resolvers for read, write and delete operations to the Deno KV database.



## Features

- GraphQL bindings for Deno KV
- relational storage schema with tables and rows
- atomically consistent query, and insert, delete mutations
- strict input and output validation



## Getting started

### Define schema in GraphQL IDL

```graphql
type Query {
  bookById(id: ID!): BookResult
}

type Mutation {
  createTransaction(data: CreateInput!): Result
  deleteTransaction(data: DeleteInput!): Result
}

input CreateInput {
  createBook: [BookInput!]! @insert(table: "Book")
  createAuthor: [AuthorInput!]! @insert(table: "Author")
}

input DeleteInput {
  deleteBook: [Identifier!]! @delete(table: "Book")
  deleteAuthor: [Identifier!]! @delete(table: "Author")
}

type Book {
  id: ID!,
  title: String!,
  author: Author!,
}

type Author {
  id: ID!,
  name: String!,
}

type BookResult {
  id: ID!
  versionstamp: String!
  value: Book!
}

input BookInput {
  id: ID!,
  title: String!,
  author: ID!,
}

input AuthorInput {
  id: ID!,
  name: String!,
}

type Result {
  versionstamp: String!
}

input Identifier {
  id: ID!,
  versionstamp: String!
}
```

### Define operations in GraphQL query language

```graphql
mutation writeBook($authorId: ID!, $bookId: ID!) {
  createTransaction(data: {
    createAuthor: [{ id: $authorId, name: "Victoria Nightshade" }],
    createBook: [{ id: $bookId, title: "Shadows of Eternity", author: $authorId }],
  }) {
    versionstamp
  }
}

query readBook($bookId: ID!) {
  bookById(id: $bookId) {
    id,
    versionstamp,
    value {
      id,  
      title,
      author {
        id,
        name,
      }
    }
  }
}

mutation deleteBook($authorId: ID!, $bookId: ID!, $versionstamp: String!) {
  deleteTransaction(data: {
    deleteAuthor: [{ id: $authorId, versionstamp: $versionstamp }],
    deleteBook: [{ id: $bookId, versionstamp: $versionstamp }],
  }) {
    versionstamp
  }
}
```

### Execute locally

```ts
import { graphql } from "npm:graphql@16.6.0";
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const schemaSource = await Deno.readTextFile("path/to/schema.graphql");
const source = await Deno.readTextFile("path/to/operations.graphql");

const db = await Deno.openKv(":memory:");

const schema = buildSchema(db, schemaSource);

const authorId = "11";
const bookId = "1";

const resultInsert = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { authorId, bookId },
  operationName: "writeBook",
});

const versionstamp = resultInsert.data.createTransaction.versionstamp;

const resultRead = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { bookId },
  operationName: "readBook",
});

const resultDelete = await graphql({
  schema,
  source,
  contextValue: {},
  variableValues: { authorId, bookId, versionstamp },
  operationName: "deleteBook",
});

db.close();
```

### Execute on server

- server

```ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { graphql } from "npm:graphql@16.6.0";
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const schemaSource = await Deno.readTextFile("path/to/schema.graphql");

const db = await Deno.openKv(":memory:");

const schema = buildSchema(db, schemaSource);

serve(async (req) => {
  const { pathname } = new URL(req.url);

  if (req.method == "POST" && pathname == "/graphql") {
    const body = await req.json();

    const res = await graphql({
      schema,
      source: body.query,
      contextValue: {},
      variableValues: body.variables,
      operationName: body.operationName,
    });

    return Response.json(JSON.stringify(res));
  } else {
    return new Response("Not Found", { status: 404 });
  }
})

window.addEventListener("unload", () => {
  db.close();
});
```

- client

```ts
const SERVER_URL = "http://localhost:8000/graphql";

const source = await Deno.readTextFile("./operations.graphql");

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

const insertResponse = await run({ authorId, bookId }, "writeBook");

const insertResult = JSON.parse(await insertResponse.json());

const versionstamp = insertResult.data.createTransaction.versionstamp;

const readResponse = await run({ bookId }, "readBook");

const readResult = JSON.parse(await readResponse.json());

const deleteResponse = await run(
  { authorId, bookId, versionstamp },
  "deleteBook",
);

const deleteResult = JSON.parse(await deleteResponse.json());
```



## Concepts

- an object type is a table, a field is a column
- a column with a value is a field with a possibly non-null scalar type
- a column with one reference to another table is a field with a possibly non-null object type
- a column with multiple references to another table is a field with a possibly non-null list of an object type
- a table must have a non-null `id: ID!` column and at least one other column
- a query must have a non-null `id: ID!` argument and return a nullable table
- a mutation must have a single `data` argument of a non-null input object type and return a nullable object type with single non-null `versionstamp: String!` field
- the input object type must have fields with
  - a directive with a single `table` argument as the table name as string
  - a non-null list non-null input object as return type, which has matching fields to the table type, except reference fields `ID`s in place of the referenced table's type



## Internals

- a row is an object with a string as id, stored at the key of the table name and id
- a reference to another row is stored as an id or array of ids
- a query can then resolve those referenced ids consecutively and put together the resulting aggregate object
- the schema is extended with the mutation directives
- it checks the data is valid when it accepts it and before it returns it, and throws `InvalidSchema`, `InvalidInput`, `DatabaseCorruption` errors otherwise



## FAQ

### Why GraphQL?

GraphQL is an ergonomic interface for reading and writing data. GraphQL provides built-in support for querying nested data, sub-selections, aliasing, etc. and all with a strict schema that enables input validation, detailed error messages, introspection, etc. GraphQL is usually used as API on a remote server but why shouldn't it be used locally for a database? It won't do as a high-performance customizable enterprise database, but for small application the better ergonomics might be well worth the price.
