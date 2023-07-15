/**
 * GraphQL bindings for Deno KV
 *
 * ## Getting started
 *
 * ```js
 * import { buildSchema } from "https://deno.land/x/denokv_graphql/mod.ts";
 *
 * const schema = buildSchema(db, schemaSource);
 * ```
 *
 * Check out the [examples](./examples).
 *
 * @module
 */

export { buildSchema } from "./src/main.ts";
export {
  ConcurrentChange,
  DatabaseCorruption,
  InvalidInput,
  InvalidSchema,
} from "./src/utils.ts";
