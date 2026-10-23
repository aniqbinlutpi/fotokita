import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import mediaRoutes from "./routes/media";

const app = new Hono();

app.use("*", cors());

const healthHandler = (c: any) => {
  return c.json({
    status: "ok",
    service: "media-service",
  });
};

app.get("/health", healthHandler);
app.get("/media/health", healthHandler);

app.route("/media", mediaRoutes);

export default {
  hostname: "127.0.0.1",
  port: Number(process.env.PORT) || 3003,
  fetch: app.fetch,
};
