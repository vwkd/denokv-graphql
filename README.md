# README

GraphQL bindings for Deno KV



## Introduction

The library exposes a single `buildSchema` function that takes a GraphQL IDL schema string and a Deno KV database and returns an executable GraphQL schema. It expects a relational schema with tables and rows and sets up the resolvers for read, write and delete operations to the Deno KV database.



## Features

- relational storage schema
  - the row id is a string, e.g. incrementing integer, UUID, etc.
  - can reference rows of another table, query resolves the references recursively and assembles result object
  - pagination over results and references, lexicographic order of row id strings
- atomic consistency
  - a query checks that there are no concurrent mutations
  - a mutation is a transactions that can mutate multiple tables
- strict input and output validation
  - invalid schema input throws an `InvalidSchema` error
  - invalid query input throws an `InvalidInput` error
  - invalid database output throws a `DatabaseCorruption` error



## Getting started

Create a schema given your Deno KV database and schema source document.

```js
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const schema = buildSchema(db, schemaSource);
```

Check out the [examples](./examples).



## Concepts

- note: if a type isn't explicitly mentioned as "non-null" or "nullable", it can be either non-null or nullable
- note: the mutation directives and the `PageInfo` type are built-in

### General

- a table is an object type, a column is a field
- a column with a value is a field of scalar type
- a table type must have an 'id' field of non-null `ID` type and at least one other field

```graphql
type Book {
  id: ID!,
  title: String
}
```

- a reference to a row of another table is a field of the other table's type

```graphql
type Book {
  id: ID!,
  title: String
  author: Author
}

type Author {
  id: ID!,
  name: String
}
```

- references to multiple rows of another table is a field of a non-null connection type with arguments 'first' of `Int` type, 'after' of `ID` type, 'last' of `Int` type, and 'before' of `ID` type
- a connection is an object type whose name ends in "Connection" with a field 'pageInfo' of non-null `PageInfo` type and a field 'edges' of non-null list of edge type
- an edge type is a object type whose name ends in "Edge" with a field 'cursor' of non-null `ID` type and a field 'node' of non-null table type
- note: the connection can only be queried using either 'first' with optional 'after' or 'last' with optional 'before', not both at the same time, nor neither!

```graphql
type Book {
  id: ID!,
  title: String
  authors(first: Int, after: ID, last: Int, before: ID): AuthorConnection!
}

type AuthorConnection {
  edges: [AuthorEdge]!
  pageInfo: PageInfo!
}

type AuthorEdge {
  node: Author!
  cursor: ID!
}

type Author {
  id: ID!,
  name: String
}
```

### Query

- a query for a single row of a table is a field of a nullable result of the table type with an argument 'id' of non-null `ID` type
- a result is an object type with a field 'versionstamp' of non-null `String` type and a field 'value' of non-null table type
- note: result is null if row with id doesn't exist!

```graphql
type Query {
  bookById(id: ID!): BookResult
  # ...
}

type BookResult {
  value: Book!
  versionstamp: String!
}

# ...
```

- a query for multiple rows of a table is a field of a connection type similar to above, except the edge type has a field 'node' of non-null result of the table type

```graphql
type Query {
  books(first: Int, after: ID, last: Int, before: ID): BookConnection!
  # ...
}

type BookConnection {
  edges: [BookEdge]!
  pageInfo: PageInfo!
}

type BookEdge {
  node: BookResult!
  cursor: ID!
}

type BookResult {
  value: Book!
  versionstamp: String!
}

type Book {
  id: ID!,
  title: String
}
```

### Mutation

- a transaction is a field of a nullable result type with an argument 'data' of non-null transaction input type
- a result is an object type with a field 'versionstamp' of non-null `String` type
- note: result is null if in insert rows already exist, or in delete the versionstamps don't match!
- a transaction input is an input object type with fields of non-null list of non-null row input type and a directive 'insert' or 'delete' with a `table` argument of the table name string

```graphql
type Mutation {
  createTransaction(data: CreateInput!): Result
  # ...
}

input CreateInput {
  createBook: [BookInput!]! @insert(table: "Book")
  # ...
}

type Result {
  versionstamp: String!
}
```

```graphql
type Mutation {
  deleteTransaction(data: DeleteInput!): Result
  # ...
}

input DeleteInput {
  deleteBook: [Identifier!]! @delete(table: "Book")
  # ...
}

type Result {
  versionstamp: String!
}
```

- an insert row input is an input object with fields matching the table type, except a reference is of `ID` type and references are of non-null list of `ID` type

```graphql
input BookInput {
  id: ID!,
  title: String
  author: ID
}
```

```graphql
input BookInput {
  id: ID!,
  title: String
  authors: [ID]!
}
```

- an delete row input is an input object with a field 'id' of non-null `ID` type and a field 'versionstamp' of non-null `String` type

```graphql
input Identifier {
  id: ID!,
  versionstamp: String!
}
```



## Internals

- a value column of a row is stored with the individual key of the table name, row id, and column name
- a reference column of a row is stored with the individual key of the table name, row id, column name, and row id of referenced table
- issue that row has potentially different versionstamp for each column, returns versionstamp of 'id' column as versionstamp for whole row, versionstamp of 'id' column must always be newest of any of row's columns
- beware: must make sure that any update mutation to row's columns also resets 'id' column to new versionstamp!



## FAQ

### Why GraphQL?

GraphQL is an ergonomic interface for reading and writing data. GraphQL provides built-in support for querying nested data, sub-selections, aliasing, etc. and all with a strict schema that enables input validation, detailed error messages, introspection, etc. GraphQL is usually used as API on a remote server but why shouldn't it be used locally for a database? It won't do as a high-performance customizable enterprise database, but for small application the better ergonomics might be well worth the price.
