import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoute from "./routes/auth";
import customizationRoute from "./routes/customization";
import { initDb, client } from "./db";
import { error } from "./lib/response";

const app = new Hono();

// Initialize DB tables on boot
initDb().catch((err) => {
  console.error("Failed to initialize tenant database on boot:", err);
});

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.onError((err, c) => {
  console.error("Tenant Service Error:", err);
  return c.json(
    error("INTERNAL_SERVER_ERROR", "Internal server error"),
    500
  );
});

app.get("/health", async (c) => {
  let dbStatus = "connected";
  try {
    await client`SELECT 1`;
  } catch {
    dbStatus = "disconnected";
  }

  return c.json({
    data: {
      status: "ok",
      service: "tenant-service",
      database: dbStatus,
    },
  });
});

// Tenant routes
app.route("/tenant/auth", authRoute);
app.route("/tenant/customization", customizationRoute);

const port = Number(process.env.PORT) || 3004;

console.log(`🏰 Fotokita Tenant Sub-Admin Service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
