import { assertEquals, assertObjectMatch, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

// note: needs to assert subset because error has additional properties like stacktrace

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, 12n],
    })
    .set(["Author", 11n], {
      id: 11n,
      name: "Victoria Nightshade",
    })
    .set(["Author", 12n], {
      id: 12n,
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
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
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [998n, 12n],
    })
    .set(["Author", 11n], {
      id: 11n,
      name: "Victoria Nightshade",
    })
    .set(["Author", 12n], {
      id: 12n,
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message: "Expected referenced table 'Author' to have row with id '998'",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("other reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, 12n],
    })
    .set(["Author", 11n], "XXX")
    .set(["Author", 12n], {
      id: 12n,
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message: "Expected referenced table 'Author' row '11' to be an object",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad id in reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, 12n],
    })
    .set(["Author", 11n], {
      id: 999n,
      name: "Victoria Nightshade",
    })
    .set(["Author", 12n], {
      id: 12n,
      name: "Sebastian Duskwood",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message:
        "Expected referenced table 'Author' row '11' column 'id' to be equal to row id",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null list", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain array of positive bigints",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad reference id", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, -999n],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain array of positive bigints",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad reference id other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, "999"],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain array of positive bigints",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null item", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        authors: null,
      },
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain at least one reference",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("non null list and item", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
        authors {
          id,
          name,
        }
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message:
        "Expected table 'Book' column 'authors' to contain at least one reference",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("minimal cyclical reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
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
  `;

  const source = `
    query {
      bookById(id: "1") {
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
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
      title: "Shadows of Eternity",
      authors: [11n, 12n],
    })
    .set(["Book", 2n], {
      id: 2n,
      title: "Whispers of the Forgotten",
      authors: [11n, 12n],
    })
    .set(["Author", 11n], {
      id: 11n,
      name: "Victoria Nightshade",
      books: [1n, 2n],
    })
    .set(["Author", 12n], {
      id: 12n,
      name: "Sebastian Duskwood",
      books: [1n, 2n],
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
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
  };

  db.close();

  assertEquals(res, exp);
});
