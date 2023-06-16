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
      author: Author,
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
        author {
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
      author: "11",
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        author: {
          id: "11",
          name: "Victoria Nightshade",
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
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
      author: Author,
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
        author {
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
      author: "999",
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        author: null,
      },
    },
    errors: [{
      message: "Referenced table 'Author' has no row with id '999'",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "author"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});

Deno.test("non null", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
      author: Author!,
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
        author {
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
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message: "Expected column 'author' to contain id but found 'undefined'",
      locations: [{ line: 6, column: 9 }],
      path: ["bookById", "author"],
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
      author: Author,
    }

    type Author {
      id: ID!,
      name: String,
      book: Book,
    }
  `;

  const source = `
    query {
      bookById(id: 1) {
        id,
        title,
        author {
          id,
          name,
          book {
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
      author: "11",
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
      book: "1",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        author: {
          id: "11",
          name: "Victoria Nightshade",
          book: {
            id: "1",
            title: "Shadows of Eternity",
          },
        },
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad id in cyclical reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
      author: Author,
    }

    type Author {
      id: ID!,
      name: String,
      book: Book,
    }
  `;

  const source = `
    query {
      bookById(id: 1) {
        id,
        title,
        author {
          id,
          name,
          book {
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
      author: "11",
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
      book: "999",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        author: {
          id: "11",
          name: "Victoria Nightshade",
          book: null,
        },
      },
    },
    errors: [{
      message: "Referenced table 'Book' has no row with id '999'",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "author"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});

Deno.test("non null in cyclical reference", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
      author: Author,
    }

    type Author {
      id: ID!,
      name: String,
      book: Book!,
    }
  `;

  const source = `
    query {
      bookById(id: 1) {
        id,
        title,
        author {
          id,
          name,
          book {
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
      author: "11",
    })
    .set(["Author", "11"], {
      id: "11",
      name: "Victoria Nightshade",
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
        author: null,
      },
    },
    errors: [{
      message: "Expected column 'book' to contain id but found 'undefined'",
      locations: [{ line: 9, column: 11 }],
      path: ["bookById", "author"],
    }],
  };

  db.close();

  // note: needs to assert subset because error has additional properties like stacktrace
  assertObjectMatch(res, exp);
});
