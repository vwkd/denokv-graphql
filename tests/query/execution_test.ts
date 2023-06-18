import { assertEquals, assertObjectMatch, graphql } from "../../deps.ts";
import { buildSchema } from "../../src/main.ts";

Deno.test("minimal working example", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
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
      bookById: {
        id: "1",
        title: "Shadows of Eternity",
      },
    },
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("null row", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "999") {
        id,
        title,
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
  };

  db.close();

  assertEquals(res, exp);
});

Deno.test("bad input id other", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "XXX") {
        id,
        title,
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
        "Expected table 'Book' argument 'id' to contain string of positive bigint",
      locations: [{ line: 3, column: 7 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad input id negative bigint", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "-999") {
        id,
        title,
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
        "Expected table 'Book' argument 'id' to contain string of positive bigint",
      locations: [{ line: 3, column: 7 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("null column", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 1n,
    })
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: {
        id: "1",
        title: null,
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
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], {
      id: 999n,
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
        "Expected table 'Book' row '1' column 'id' to be equal to row id",
      locations: [{ line: 3, column: 7 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});

Deno.test("bad row", async () => {
  const schemaSource = `
    type Query {
      bookById(id: ID!): Book
    }

    type Book {
      id: ID!,
      title: String,
    }
  `;

  const source = `
    query {
      bookById(id: "1") {
        id,
        title,
      }
    }
  `;

  const db = await Deno.openKv(":memory:");
  await db.atomic()
    .set(["Book", 1n], "XXX")
    .commit();

  const schema = buildSchema(db, schemaSource);

  const res = await graphql({ schema, source });

  const exp = {
    data: {
      bookById: null,
    },
    errors: [{
      message: "Expected table 'Book' row '1' to be an object",
      locations: [{ line: 3, column: 7 }],
      path: ["bookById"],
    }],
  };

  db.close();

  assertObjectMatch(res, exp);
});
