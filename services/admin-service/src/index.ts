import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoute from "./routes/auth";
import dashboardRoute from "./routes/dashboard";
import { error } from "./lib/response";

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.onError((err, c) => {
  console.error("Admin Service Error:", err);
  return c.json(
    error("INTERNAL_SERVER_ERROR", "Ralat dalaman server"),
    500
  );
});

app.get("/health", (c) => {
  return c.json({
    data: {
      status: "ok",
      service: "admin-service",
    },
  });
});

// Admin API endpoints
app.route("/admin/auth", authRoute);
app.route("/admin", dashboardRoute);

const port = Number(process.env.PORT) || 3002;

console.log(`🛡️ Fotokita Admin Service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
