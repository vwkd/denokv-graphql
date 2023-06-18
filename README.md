# README

A GraphQL API for Deno KV



## Motivation

GraphQL is a highly ergonomic API for a remote server. Why shouldn't the same interface work locally against your database? GraphQL provides built-in support for querying across joined tables, selective querying, aliasing, detailed error messages, and much more. This library offers a GraphQL API for your Deno KV database. It won't replace your high-performance customizable enterprise database, but for small application the better ergonomics might be well worth the price.



## Features

- generates GraphQL API for Deno KV from GraphQL IDL schema
- query across tables joins tables automatically
- insert mutation with auto-incrementing IDs
- delete mutation
- atomically consistent, except for queries that join across tables since each row depends on the previous row



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
