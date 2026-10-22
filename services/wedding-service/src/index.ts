import { Hono } from "hono";
import { cors } from "hono/cors";
import { db, initDb } from "./db";
import { sql } from "drizzle-orm";
import weddings from "./routes/weddings";
import { error } from "./lib/response";

const app = new Hono({ strict: false });

// Initialize PostgreSQL database tables on startup
initDb().catch((err) => {
  console.error("Failed to initialize wedding database tables on startup:", err);
});

app.use("*", cors());

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

const healthHandler = async (c: any) => {
  let dbStatus = "connected";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "disconnected";
  }

  return c.json({
    data: {
      status: "ok",
      service: "wedding-service",
      database: dbStatus,
    },
  });
};

app.get("/health", healthHandler);
app.get("/weddings/health", healthHandler);

app.route("/weddings", weddings);
app.route("/", weddings);

export default {
  port: 3001,
  fetch: app.fetch,
};
