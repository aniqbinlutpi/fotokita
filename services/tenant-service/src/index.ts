import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoute from "./routes/auth";
import customizationRoute from "./routes/customization";
import invitationRoute from "./routes/invitation";
import maintenanceRoute from "./routes/maintenance";
import { runMediaRetentionCleanup } from "./services/cleanup.service";
import { initDb, client } from "./db";
import { error } from "./lib/response";

const app = new Hono();

// Initialize DB tables on boot
initDb().catch((err) => {
  console.error("Failed to initialize tenant database on boot:", err);
});

// Periodic media retention cleanup: runs 10 seconds after boot, then every 1 hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
setTimeout(() => {
  runMediaRetentionCleanup().catch((err) => {
    console.error("Initial media retention cleanup error:", err);
  });
}, 10000);

setInterval(() => {
  runMediaRetentionCleanup().catch((err) => {
    console.error("Scheduled media retention cleanup error:", err);
  });
}, CLEANUP_INTERVAL_MS);

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

const healthHandler = async (c: any) => {
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
};

app.get("/health", healthHandler);
app.get("/tenant/health", healthHandler);

// Tenant routes
app.route("/tenant/auth", authRoute);
app.route("/tenant/customization", customizationRoute);
app.route("/tenant/invitation", invitationRoute);
app.route("/tenant/maintenance", maintenanceRoute);
app.route("/tenant", maintenanceRoute); // mounts /tenant/accounts and /tenant/accounts/:weddingId/...

const port = Number(process.env.PORT) || 3004;

console.log(`🏰 Fotokita Tenant Sub-Admin Service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
