import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import mediaRoutes from "./routes/media";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "media-service",
  });
});

app.route("/media", mediaRoutes);

export default app;
