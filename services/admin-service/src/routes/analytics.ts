import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "./auth";
import { success, error } from "../lib/response";
import {
  trackVisitorSession,
  trackAnalyticsEvent,
  getAnalyticsOverview,
} from "../services/analytics";
import { db } from "../db";
import { visitorSessions, analyticsEvents } from "../db/schema";
import { KNOWN_REGIONAL_COORDINATES } from "../lib/geo";

const analyticsRoute = new Hono();

const trackSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  weddingSlug: z.string().nullable().optional(),
  pagePath: z.string().optional().default("/"),
  durationIncrement: z.number().nonnegative().optional().default(0),
  isNewPageview: z.boolean().optional().default(false),
  device: z.string().optional().default("desktop"),
  browser: z.string().optional(),
  os: z.string().optional(),
  referrer: z.string().optional(),
});

const eventSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  weddingSlug: z.string().nullable().optional(),
  eventName: z.string().min(1, "Event name is required"),
  pagePath: z.string().optional().default("/"),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ---------------------------------------------------------------------------
// Public Ingestion Endpoints (Called from browser tracker)
// ---------------------------------------------------------------------------

// POST /admin/analytics/track
analyticsRoute.post("/track", async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => null);
    if (!rawBody) {
      return c.json(error("VALIDATION_ERROR", "Invalid JSON payload"), 400);
    }

    const parsed = trackSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(error("VALIDATION_ERROR", "Validation failed", parsed.error.flatten()), 400);
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(c.req.header())) {
      if (value) headers.set(key, value);
    }

    const result = await trackVisitorSession(parsed.data, headers);
    return c.json(success(result));
  } catch (err) {
    console.error("Analytics track error:", err);
    return c.json(error("TRACK_ERROR", "Failed to track analytics session"), 500);
  }
});

// POST /admin/analytics/event
analyticsRoute.post("/event", async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => null);
    if (!rawBody) {
      return c.json(error("VALIDATION_ERROR", "Invalid JSON payload"), 400);
    }

    const parsed = eventSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(error("VALIDATION_ERROR", "Validation failed", parsed.error.flatten()), 400);
    }

    const result = await trackAnalyticsEvent(parsed.data);
    return c.json(success(result));
  } catch (err) {
    console.error("Analytics event error:", err);
    return c.json(error("EVENT_ERROR", "Failed to track analytics event"), 500);
  }
});

// ---------------------------------------------------------------------------
// Protected Query Endpoints (Called by Admin Dashboard)
// ---------------------------------------------------------------------------

// GET /admin/analytics/overview?range=30d&weddingSlug=ali-dan-siti
analyticsRoute.get("/overview", requireAdminAuth, async (c) => {
  try {
    const timeRange = c.req.query("range") || "30d";
    const weddingSlug = c.req.query("weddingSlug") || undefined;

    const data = await getAnalyticsOverview(timeRange, weddingSlug);
    return c.json(success(data));
  } catch (err) {
    console.error("Analytics overview query error:", err);
    return c.json(error("QUERY_ERROR", "Failed to fetch analytics overview"), 500);
  }
});

// POST /admin/analytics/seed-demo (Allows seeding realistic demo sessions if testing on a clean database)
analyticsRoute.post("/seed-demo", requireAdminAuth, async (c) => {
  try {
    const locations = Object.keys(KNOWN_REGIONAL_COORDINATES);
    const devices = ["mobile", "mobile", "desktop", "desktop", "tablet"];
    const now = Date.now();
    const demoSessions = [];

    for (let i = 0; i < 45; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const seenAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600 * 1000 * 12);
      const locKey = locations[Math.floor(Math.random() * locations.length)] || "Kuala Lumpur";
      const loc = KNOWN_REGIONAL_COORDINATES[locKey] || KNOWN_REGIONAL_COORDINATES["Kuala Lumpur"]!;
      const duration = Math.floor(Math.random() * 380) + 45;

      demoSessions.push({
        sessionId: `demo-sess-${i}-${Math.random().toString(36).substring(2, 7)}`,
        weddingSlug: i % 3 === 0 ? "ali-dan-siti" : i % 3 === 1 ? "daniel-and-clara" : null,
        pagePath: i % 2 === 0 ? "/w/ali-dan-siti" : "/",
        referrer: i % 2 === 0 ? "https://instagram.com" : "Direct",
        device: devices[i % devices.length],
        browser: i % 2 === 0 ? "Mobile Safari" : "Chrome",
        os: i % 2 === 0 ? "iOS" : "macOS",
        ipHash: `hash-${i}`,
        country: loc.country,
        countryCode: loc.countryCode,
        region: locKey,
        city: loc.city,
        latitude: loc.lat,
        longitude: loc.lng,
        durationSeconds: duration,
        pageViewsCount: Math.floor(Math.random() * 5) + 1,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
    }

    await db.insert(visitorSessions).values(demoSessions);

    return c.json(success({ message: "Seeded 45 demo analytics sessions", count: 45 }));
  } catch (err) {
    console.error("Seed demo error:", err);
    return c.json(error("SEED_ERROR", "Failed to seed demo data"), 500);
  }
});

export default analyticsRoute;
