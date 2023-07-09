# README

GraphQL bindings for Deno KV



## Getting started

```js
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const schema = buildSchema(db, schemaSource);
```

Check out the [examples](./examples).



## Features

- relational schema
- atomic consistency
- strict input and output validation



## Concepts

- tables and rows, a column can reference rows of another table
- the row id is a string, provided by user, e.g. incrementing integer, UUID, etc.
- a query assembles result object(s), resolves references recursively, checks that there are no concurrent mutations
- a many query paginates over results and references in lexicographic order of row id strings, implements Relay pagination spec
- a mutation is a transaction, can mutate multiple tables with atomic consistency
- invalid schema input throws an `InvalidSchema` error
- invalid query input throws an `InvalidInput` error
- invalid database output throws a `DatabaseCorruption` error



## Schema

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

- sets up resolvers for read, write and delete operations to the Deno KV database
- a value column of a row is stored with the individual key of the table name, row id, and column name
- a reference column of a row is stored with the individual key of the table name, row id, column name, and row id of referenced table
- issue that row has potentially different versionstamp for each column, returns versionstamp of 'id' column as versionstamp for whole row, versionstamp of 'id' column must always be newest of any of row's columns
- beware: must make sure that any update mutation to row's columns also resets 'id' column to new versionstamp!



## FAQ

### Why GraphQL?

GraphQL is an ergonomic interface for selecting nested data with additional features like aliases, input validation, detailed error messages, introspection, and more thanks to a strict schema. GraphQL may be more popularly known as API of a remote server, but nothing prevents it from being used as local interface of a database. As additional layer between user and database it decreases performance, but it adds meaningfully better ergonomics which might be worth the price.
