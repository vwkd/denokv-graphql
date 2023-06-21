import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

// note: needs to assert subset because error has additional properties like stacktrace

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: [
            {
              id: "11",
              name: "Victoria Nightshade",
            },
            {
              id: "12",
              name: "Sebastian Duskwood",
            },
          ],
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["998", "12"],
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: null,
        },
      },
    },
    errors: [{
      message: "Expected referenced table 'Author' to have row with id '998'",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("other reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], "XXX")
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: null,
        },
      },
    },
    errors: [{
      message: "Expected referenced table 'Author' row '11' to be an object",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad id in reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], {
      id: "999",
      name: "Victoria Nightshade",
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: null,
        },
      },
    },
    errors: [{
      message:
        "Expected referenced table 'Author' row '11' column 'id' to be equal to row id",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain array of strings",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad reference id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", 999],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: null,
        },
      },
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain array of strings",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null item", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author!],
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: [],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: null,
        },
      },
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain at least one reference",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null list and item", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author!]!,
    }

    type Author {
      id: ID!,
      name: String,
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: [],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain at least one reference",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "value"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("minimal cyclical reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): BookResult
    }

    type Book {
      id: ID!,
      title: String,
      authors: [Author],
    }

    type Author {
      id: ID!,
      name: String,
      books: [Book],
    }

    type BookResult {
      id: ID!
      versionstamp: String!
      value: Book!
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        versionstamp,
        value {
          id,
          title,
          authors {
            id,
            name,
            books {
              id,
              title,
            }
          }
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["11", "12"],
    })
    .set(["Book", "2"], {
      id: "2",
      title: "Whispers of the Forgotten",
      authors: ["11", "12"],
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
      books: ["1", "2"],
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
      books: ["1", "2"],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source, contextValue: {} });

  const exp = {
    data: {
      bookById: {
        id: "1",
        versionstamp: "00000000000000010000",
        value: {
          id: "1",
          title: "Shadows of Eternity",
          authors: [
            {
              id: "11",
              name: "Victoria Nightshade",
              books: [
                {
                  id: "1",
                  title: "Shadows of Eternity",
                },
                {
                  id: "2",
                  title: "Whispers of the Forgotten",
                },
              ],
            },
            {
              id: "12",
              name: "Sebastian Duskwood",
              books: [
                {
                  id: "1",
                  title: "Shadows of Eternity",
                },
                {
                  id: "2",
                  title: "Whispers of the Forgotten",
                },
              ],
            },
          ],
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});
