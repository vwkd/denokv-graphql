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

Create a schema given your Deno KV database and schema source document.

```js
import { buildSchema } from "https://raw.githubusercontent.com/vwkd/graphql-denokv/main/src/main.ts";

const schema = buildSchema(db, schemaSource);
```

Check out the [examples](./examples).



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
