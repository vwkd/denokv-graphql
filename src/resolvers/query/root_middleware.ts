import type { IMiddlewareFunction } from "../../../deps.ts";
import { ConcurrentChange } from "../../utils.ts";

/**
 * Add versionstamp to query
 *
 * - check versionstamps of all sub-queries
 * - use resulting versionstamp (newer than any of the sub-query versionstamps)
 * - throws `ConcurrentChange` error like nested field resolver
 * - note: factory function since needs `db` object
 */
export const addQueryVersionstamp: (db: Deno.Kv) => IMiddlewareFunction =
  (db) => async (resolve, root, args, context, info) => {
    const res = await resolve(root, args, context, info);

    const checks = context.checks;

    // note: null if root resolver returns null
    // todo: can return null?
    if (checks) {
      let resCheck = await db.atomic()
        .check(...checks)
        .commit();

      if (!resCheck.ok) {
        throw new ConcurrentChange(
          `Detected concurrent change in some of the read rows. Try request again.`,
        );
      }
    }

    return res;
  };
