import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoute from "./routes/auth";
import dashboardRoute from "./routes/dashboard";
import invitesRoute from "./routes/invites";
import inquiriesRoute from "./routes/inquiries";
import vouchersRoute from "./routes/vouchers";
import { initDb, client } from "./db";
import { error } from "./lib/response";

const app = new Hono();

// Initialize PostgreSQL database tables on startup
initDb().catch((err) => {
  console.error("Failed to initialize database tables on startup:", err);
});

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.onError((err, c) => {
  console.error("Admin Service Error:", err);
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
      service: "admin-service",
      database: dbStatus,
    },
  });
};

app.get("/health", healthHandler);
app.get("/admin/health", healthHandler);

// Admin API endpoints
app.route("/admin/auth", authRoute);
app.route("/admin/invites", invitesRoute);
app.route("/admin/inquiries", inquiriesRoute);
app.route("/admin/vouchers", vouchersRoute);
app.route("/admin", dashboardRoute);

const port = Number(process.env.PORT) || 3002;

console.log(`🛡️ Fotokita Admin Service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
