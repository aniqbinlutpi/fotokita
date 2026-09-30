import { Hono } from "hono";
import { requireAdminAuth } from "./auth";
import { success, error } from "../lib/response";

const dashboardRoute = new Hono();

const WEDDING_SERVICE_URL = process.env.WEDDING_SERVICE_URL || "http://localhost:3001";
const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || "http://localhost:3000";

dashboardRoute.use("*", requireAdminAuth);

// Aggregated Stats
dashboardRoute.get("/stats", async (c) => {
  let weddings: any[] = [];
  let weddingServiceStatus = "down";
  let mediaServiceStatus = "down";

  // Check Wedding Service
  try {
    const res = await fetch(`${WEDDING_SERVICE_URL}/weddings`);
    if (res.ok) {
      weddingServiceStatus = "ok";
      const json = (await res.json()) as any;
      weddings = json.data || [];
    }
  } catch {
    weddingServiceStatus = "down";
  }

  // Check Media Service
  try {
    const res = await fetch(`${MEDIA_SERVICE_URL}/health`);
    if (res.ok) {
      mediaServiceStatus = "ok";
    }
  } catch {
    mediaServiceStatus = "down";
  }

  // Count total media across weddings
  let totalMediaCount = 0;
  if (weddings.length > 0 && mediaServiceStatus === "ok") {
    try {
      const mediaCounts = await Promise.all(
        weddings.slice(0, 50).map(async (w: any) => {
          try {
            const mRes = await fetch(`${MEDIA_SERVICE_URL}/media?weddingId=${w.id}`);
            if (mRes.ok) {
              const mJson = (await mRes.json()) as any;
              return Array.isArray(mJson.data) ? mJson.data.length : 0;
            }
          } catch {
            return 0;
          }
          return 0;
        })
      );
      totalMediaCount = mediaCounts.reduce((acc: number, curr: number) => acc + curr, 0);
    } catch {
      // ignore
    }
  }

  return c.json(
    success({
      totalWeddings: weddings.length,
      totalMedia: totalMediaCount,
      services: {
        weddingService: weddingServiceStatus,
        mediaService: mediaServiceStatus,
        adminService: "ok",
      },
      recentWeddings: weddings.slice(-5).reverse(),
    })
  );
});

// List all weddings
dashboardRoute.get("/weddings", async (c) => {
  try {
    const res = await fetch(`${WEDDING_SERVICE_URL}/weddings`);
    if (!res.ok) {
      return c.json(error("UPSTREAM_ERROR", "Gagal mendapatkan senarai majlis dari wedding-service"), 502);
    }
    const json = (await res.json()) as any;
    return c.json(success(json.data || []));
  } catch (err: any) {
    return c.json(error("SERVICE_UNAVAILABLE", "Wedding service tidak dapat dihubungi"), 503);
  }
});

// Create wedding
dashboardRoute.post("/weddings", async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const res = await fetch(`${WEDDING_SERVICE_URL}/weddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as any;
    return c.json(json, res.status as any);
  } catch {
    return c.json(error("SERVICE_UNAVAILABLE", "Wedding service tidak dapat dihubungi"), 503);
  }
});

// Delete wedding
dashboardRoute.delete("/weddings/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const res = await fetch(`${WEDDING_SERVICE_URL}/weddings/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const json = (await res.json()) as any;
    return c.json(json, res.status as any);
  } catch {
    return c.json(error("SERVICE_UNAVAILABLE", "Wedding service tidak dapat dihubungi"), 503);
  }
});

// System Health Overview
dashboardRoute.get("/health", async (c) => {
  const checks = {
    weddingService: false,
    mediaService: false,
    adminService: true,
  };

  try {
    const wRes = await fetch(`${WEDDING_SERVICE_URL}/health`);
    checks.weddingService = wRes.ok;
  } catch {}

  try {
    const mRes = await fetch(`${MEDIA_SERVICE_URL}/health`);
    checks.mediaService = mRes.ok;
  } catch {}

  return c.json(
    success({
      timestamp: new Date().toISOString(),
      services: checks,
    })
  );
});

export default dashboardRoute;
