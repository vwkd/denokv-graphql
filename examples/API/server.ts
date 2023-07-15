/**
 * API server example
 *
 * Run with `deno run --unstable --allow-read --allow-net examples/API/server.ts`
 */
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { graphql } from "npm:graphql@16.6.0";
import { buildSchema } from "https://deno.land/x/denokv_graphql/src/main.ts";

const schemaSource = await Deno.readTextFile("./examples/basic/schema.graphql");

const db = await Deno.openKv(":memory:");

const schema = buildSchema(db, schemaSource);

serve(async (req) => {
  const { pathname } = new URL(req.url);

  if (req.method == "POST" && pathname == "/graphql") {
    const body = await req.json();

    const res = await graphql({
      schema,
      source: body.query,
      contextValue: {},
      variableValues: body.variables,
      operationName: body.operationName,
    });

    return Response.json(JSON.stringify(res));
  } else {
    return new Response("Not Found", { status: 404 });
  }
});

window.addEventListener("unload", () => {
  db.close();
});
