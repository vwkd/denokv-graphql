import { assertEquals, assertObjectMatch, graphql } from "../deps.ts";
import { buildSchema } from "../src/main.ts";

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
      bookById(id: 1) {
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

Deno.test("corrupted id", async () => {
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
      bookById(id: 1) {
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
      message: "Referenced table 'Author' has no row with id '998'",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});

Deno.test("corrupted ids", async () => {
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
      bookById(id: 1) {
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
    .set(["Book", "1"], {
      id: "1",
      title: "Shadows of Eternity",
      authors: ["998", "999"],
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
      message: "Referenced table 'Author' has no rows with ids '998', '999'",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "authors"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
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
      bookById(id: 1) {
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

Deno.test("corrupted id in cyclical reference", async () => {
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
      bookById(id: 1) {
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
      books: ["998", "2"],
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
      books: ["1", "2"],
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
            books: null,
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
    errors: [{
      message: "Referenced table 'Book' has no row with id '998'",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "authors", 0, "books"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});

Deno.test("corrupted ids in cyclical reference", async () => {
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
      bookById(id: 1) {
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
      books: ["998", "999"],
    })
    .set(["Author", "12"], {
      id: "12",
      name: "Sebastian Duskwood",
      books: ["1", "2"],
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
            books: null,
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
    errors: [{
      message: "Referenced table 'Book' has no rows with ids '998', '999'",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "authors", 0, "books"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});
