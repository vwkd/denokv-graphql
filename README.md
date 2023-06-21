# README

A GraphQL API for Deno KV



## Introduction

This is an experimental library to create GraphQL resolvers for Deno KV. It offers a single API `buildSchema` function that builds a GraphQL schema for Deno KV from a GraphQL IDL schema string, that can then be used with any executor like `graphql()` from `graphql-js`.

GraphQL is an ergonomic interface for reading and writing data. GraphQL provides built-in support for querying nested data, sub-selections, aliasing, etc. and all with a strict schema that enables input validation, detailed error messages, introspection, etc. GraphQL is usually used as API on a remote server but why shouldn't it be used locally for a database? It won't do as a high-performance customizable enterprise database, but for small application the better ergonomics might be well worth the price.



## Features

- ergonomic GraphQL API for Deno KV
- relational storage schema with tables and rows
- atomically consistent query, and insert, delete mutations



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
    createTransaction(data: CreateInput!): Result
    deleteTransaction(data: DeleteInput!): Result
  }

  input CreateInput {
    createBook: [BookInput!]! @insert(table: "Book")
    createAuthor: [AuthorInput!]! @insert(table: "Author")
  }

  input DeleteInput {
    deleteBook: [DeleteInput!]! @insert(table: "Book")
    deleteAuthor: [DeleteInput!]! @insert(table: "Author")
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
`;

const schema = buildSchema(db, schemaSource);

const authorId = "11";

const source1 = `
  mutation($authorId: ID!) {
    createAuthor(data: [{ id: $authorId, name: "Victoria Nightshade" }]) {
      versionstamp,
    }
  }
`;

const res1 = await graphql({ schema, source: source1, contextValue: {}, variableValues: { authorId } });
console.log(JSON.stringify(res1, null, 2));

const bookId = "1";

const source2 = `
  mutation($bookId: ID!, $authorId: ID!) {
    createBook(data: [{ id: $bookId, title: "Shadows of Eternity", author: $authorId }]) {
      versionstamp,
    }
  }
`;

const res2 = await graphql({ schema, source: source2, contextValue: {}, variableValues: { bookId, authorId } });
console.log(JSON.stringify(res2, null, 2));

const source3 = `
  query($bookId: ID!) {
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
`;

const res3 = await graphql({ schema, source: source3, contextValue: {}, variableValues: { bookId } });
console.log(JSON.stringify(res3, null, 2));

const source4 = `
  mutation($bookId: ID!) {
    deleteBookById(id: $bookId)
  }
`;

const res4 = await graphql({ schema, source: source4, contextValue: {}, variableValues: { bookId } });
console.log(JSON.stringify(res4, null, 2));

const source5 = `
  mutation($authorId: ID!) {
    deleteAuthorById(id: $authorId)
  }
`;

const res5 = await graphql({ schema, source: source5, contextValue: {}, variableValues: { authorId } });
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
