import "dotenv/config";

import { Hono } from "hono";
import mediaRoutes from "./routes/media";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "media-service",
  });
});

app.route("/media", mediaRoutes);

export default app;
