# README

A GraphQL API for Deno KV



## Motivation

Use GraphQL as highly ergonomic API for your Deno KV database. GraphQL is a nice interface for a remote API server, why shouldn't the same interface work locally against your database? GraphQL provides built-in support for joining tables, selective querying, aliasing, detailed error messages, and more. No, it probably won't replace your high-performance enterprise database, but for your small application the better ergonomics might be well worth the price of a simple low performance interface.



## Features

- generate GraphQL API for Deno KV from GraphQL schema
- autoincrementing IDs
- note: query that joins tables is not atomically consistent because multiple inter-dependent reads
