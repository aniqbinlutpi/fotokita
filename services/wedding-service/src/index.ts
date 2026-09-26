import { Hono } from "hono";
import { db } from "./db";
import { sql } from "drizzle-orm";
import weddings from "./routes/weddings";
import { error } from "./lib/response";

const app = new Hono();

app.onError((err, c) => {
  console.error(err);

  return c.json(
    error(
      "INTERNAL_SERVER_ERROR",
      "Something went wrong",
    ),
    500,
  );
});

app.get("/health", async (c) => {
  await db.execute(sql`SELECT 1`);

  return c.json({
    data: {
      status: "ok",
      service: "wedding-service",
      database: "connected",
    },
  });
});

app.route("/weddings", weddings);

export default {
  port: 3001,
  fetch: app.fetch,
};
