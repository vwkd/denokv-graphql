export class DatabaseCorruption extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "DatabaseCorruption";
  }
}

export class InvalidSchema extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "InvalidSchema";
  }
}

export class InvalidInput extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "InvalidInput";
  }
}

export class ConcurrentChange extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = "ConcurrentChange";
  }
}

export function isObject(value: unknown): value is object {
  return value != null && value.constructor.name === "Object";
}

/**
 * Multi-range list
 *
 * note: workaround for [#414](https://github.com/denoland/deploy_feedback/issues/414), pagination isn't possible
 * @param db Deno KV database
 * @param prefixes multiple prefixes
 * @returns array of entries
 */
export async function listMultiple<T = unknown>(
  db: Deno.Kv,
  prefixes: Deno.KvKey[],
): Promise<Deno.KvEntry<T>[]> {
  const MAX_RETRIES = 100;

  const checks: Deno.AtomicCheck[] = [];

  let res: Deno.KvEntry<T>[] = [];

  let count = 0;
  let checkRes = { ok: false };

  while (!checkRes.ok) {
    // prevent infinite loop
    if (count > MAX_RETRIES) {
      throw new Error(`Exceeded maximum retries to concurrent changes`);
    }

    // reset previous iteration
    res = [];

    for (const prefix of prefixes) {
      const entries = db.list<T>({ prefix });

      for await (const entry of entries) {
        checks.push({ key: entry.key, versionstamp: entry.versionstamp });
        res.push(entry);
      }
    }

    checkRes = await db.atomic().check(...checks).commit();
    count += 1;
  }

  return res;
}
