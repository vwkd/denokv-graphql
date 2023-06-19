# README

A GraphQL API for Deno KV



## Introduction

This is an experimental library to create GraphQL resolvers for Deno KV. It offers a single API `buildSchema` function that builds a GraphQL schema for Deno KV from a GraphQL IDL schema string, that can then be used with any executor like `graphql()` from `graphql-js`.

GraphQL is an ergonomic interface for reading and writing data. GraphQL provides built-in support for querying nested data, sub-selections, aliasing, etc. and all with a strict schema that enables input validation, detailed error messages, introspection, etc. GraphQL is usually used as API on a remote server but why shouldn't it be used locally for a database? It won't do as a high-performance customizable enterprise database, but for small application the better ergonomics might be well worth the price.



## Features

- relational storage schema with tables and rows
- query, insert and delete mutations
- query "joins" tables automatically
- insert mutation automatically generates auto-incrementing row id
- strict schema enables input validation, database validation, error messages, introspection, etc.
- atomically consistent, except for queries that join tables since each row depends on the previous row



## Usage

```ts
import { graphql } from "npm:graphql@16.6.0";
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const db = await Deno.openKv(":memory:");

const schemaSource = `
  type Query {
    bookById(id: ID!): BookResult
  }

  type Mutation {
    createBook(data: BookInput!): Result @insert(table: "Book")
    createAuthor(data: AuthorInput!): Result @insert(table: "Author")
    deleteBookById(id: ID!): Void @delete(table: "Book")
    deleteAuthorById(id: ID!): Void @delete(table: "Book")
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
    title: String!,
    author: ID!,
  }

  input AuthorInput {
    name: String!,
  }
`;

const schema = buildSchema(db, schemaSource);

const source1 = `
  mutation {
    createAuthor(data: { name: "Victoria Nightshade" }) {
      id,
      versionstamp,
    }
  }
`;

const res1 = await graphql({ schema, source: source1 });
console.log(JSON.stringify(res1, null, 2));
const authorId = res1.data.createAuthor.id;

const source2 = `
  mutation {
    createBook(data: { title: "Shadows of Eternity", author: "${authorId}" }) {
      id,
      versionstamp,
    }
  }
`;

const res2 = await graphql({ schema, source: source2 });
console.log(JSON.stringify(res2, null, 2));
const bookId = res2.data.createBook.id;

const source3 = `
  query {
    bookById(id: "${bookId}") {
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
`;

const res3 = await graphql({ schema, source: source3 });
console.log(JSON.stringify(res3, null, 2));

const source4 = `
  mutation {
    deleteBookById(id: "${bookId}")
  }
`;

const res4 = await graphql({ schema, source: source4 });
console.log(JSON.stringify(res4, null, 2));

const source5 = `
  mutation {
    deleteAuthorById(id: "${authorId}")
  }
`;

const res5 = await graphql({ schema, source: source5 });
console.log(JSON.stringify(res5, null, 2));

db.close();
```



## Concepts

- an object type is a table, a field is a column
- a column with a value is a field with a possibly non-null scalar type
- a column with one reference to another table is a field with a possibly non-null object type
- a column with multiple references to another table is a field with a possibly non-null list of an object type
- a table must have a non-null `id: ID!` column and at least one other column
- a query must have a non-null `id: ID!` argument and return a nullable table
- a mutation must have a directive with a single `table` argument as the table name as string
- an insert mutation must take a single `data` argument of a non-null input object type and return a nullable `Result`
- the input data type must have matching fields to the table type, except no `id` field and in reference fields `ID`s in place of the referenced table's type



## Internals

- a row is an object with an id, stored at the key of the table name and id
- an id is a bigint, but due to limitations of JSON it must serialize it to string in the response and parse it from string in the request
- a reference to another row is stored as an id or array of ids
- a query can then resolve those referenced ids consecutively and put together the resulting aggregate object
- note: a query across multiple tables is not atomically consistent because it needs multiple inter-dependent reads
- the schema is extended with the `Result` type, the mutation directives, and the `Void` scalar
- it checks the data is valid when it accepts it and before it returns it, and throws `InvalidSchema`, `InvalidInput`, `DatabaseCorruption` errors otherwise
