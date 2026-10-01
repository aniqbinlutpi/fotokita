import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { tenantAccounts, tenantCustomizations } from "../db/schema";
import { runMediaRetentionCleanup } from "../services/cleanup.service";
import { success, error } from "../lib/response";

const maintenanceRoute = new Hono();

// POST /tenant/maintenance/cleanup - Run media retention cleanup manually
maintenanceRoute.post("/cleanup", async (c) => {
  try {
    const result = await runMediaRetentionCleanup();
    return c.json(success(result));
  } catch (err: any) {
    console.error("Cleanup maintenance failed:", err);
    return c.json(error("CLEANUP_FAILED", "Failed to run media retention cleanup", err?.message), 500);
  }
});

// GET /tenant/maintenance/stats - Get tenant accounts subscription metrics
maintenanceRoute.get("/stats", async (c) => {
  try {
    const accounts = await db.select().from(tenantAccounts);
    const now = new Date().getTime();

    const totalSubscribers = accounts.length;
    const activeSubscribers = accounts.filter(
      (a) => a.status === "active" && (!a.planExpiresAt || new Date(a.planExpiresAt).getTime() > now)
    ).length;
    const planExpired = accounts.filter(
      (a) => a.planExpiresAt && new Date(a.planExpiresAt).getTime() <= now && !a.mediaCleanedUp
    ).length;
    const archived = accounts.filter((a) => a.mediaCleanedUp || a.status === "archived").length;
    const preservedCount = accounts.filter((a) => a.preserveMedia).length;

    return c.json(
      success({
        totalSubscribers,
        activeSubscribers,
        planExpired,
        archived,
        preservedCount,
      })
    );
  } catch (err: any) {
    return c.json(error("DATABASE_ERROR", "Failed to retrieve subscription stats"), 500);
  }
});

// GET /tenant/accounts - List all tenant accounts with subscription details
maintenanceRoute.get("/accounts", async (c) => {
  try {
    const accounts = await db
      .select({
        id: tenantAccounts.id,
        username: tenantAccounts.username,
        email: tenantAccounts.email,
        weddingId: tenantAccounts.weddingId,
        weddingSlug: tenantAccounts.weddingSlug,
        weddingName: tenantAccounts.weddingName,
        planTier: tenantAccounts.planTier,
        planExpiresAt: tenantAccounts.planExpiresAt,
        mediaExpiresAt: tenantAccounts.mediaExpiresAt,
        preserveMedia: tenantAccounts.preserveMedia,
        status: tenantAccounts.status,
        mediaCleanedUp: tenantAccounts.mediaCleanedUp,
        createdAt: tenantAccounts.createdAt,
        updatedAt: tenantAccounts.updatedAt,
      })
      .from(tenantAccounts)
      .orderBy(desc(tenantAccounts.createdAt));

    return c.json(success(accounts));
  } catch (err: any) {
    return c.json(error("DATABASE_ERROR", "Failed to list tenant accounts"), 500);
  }
});

const preserveMediaSchema = z.object({
  preserveMedia: z.boolean(),
});

// PATCH /tenant/accounts/:weddingId/preserve-media - Toggle preserve media flag (disable auto-delete)
maintenanceRoute.patch("/accounts/:weddingId/preserve-media", async (c) => {
  const weddingId = c.req.param("weddingId");
  const body = await c.req.json().catch(() => null);
  const parsed = preserveMediaSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(error("VALIDATION_ERROR", "Field 'preserveMedia' (boolean) is required"), 400);
  }

  try {
    const updated = await db
      .update(tenantAccounts)
      .set({
        preserveMedia: parsed.data.preserveMedia,
        updatedAt: new Date(),
      })
      .where(eq(tenantAccounts.weddingId, weddingId))
      .returning();

    const updatedRow = updated[0];
    if (!updatedRow) {
      return c.json(error("NOT_FOUND", "Tenant account not found for weddingId"), 404);
    }

    return c.json(
      success({
        weddingId,
        preserveMedia: updatedRow.preserveMedia,
        message: updatedRow.preserveMedia
          ? "Auto-delete disabled: Media will be preserved permanently."
          : "Auto-delete enabled: Media will be deleted according to retention policy.",
      })
    );
  } catch (err: any) {
    console.error("Failed to update preserveMedia:", err);
    return c.json(error("DATABASE_ERROR", "Failed to update preserveMedia setting"), 500);
  }
});

const extendPlanSchema = z.object({
  additionalDays: z.number().positive(),
});

// PATCH /tenant/accounts/:weddingId/extend-plan - Extend plan duration
maintenanceRoute.patch("/accounts/:weddingId/extend-plan", async (c) => {
  const weddingId = c.req.param("weddingId");
  const body = await c.req.json().catch(() => null);
  const parsed = extendPlanSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(error("VALIDATION_ERROR", "Field 'additionalDays' (positive number) is required"), 400);
  }

  try {
    const existing = await db
      .select()
      .from(tenantAccounts)
      .where(eq(tenantAccounts.weddingId, weddingId))
      .limit(1);

    const tenant = existing[0];
    if (!tenant) {
      return c.json(error("NOT_FOUND", "Tenant account not found for weddingId"), 404);
    }

    const msToAdd = parsed.data.additionalDays * 24 * 60 * 60 * 1000;
    const basePlanExpiry =
      tenant.planExpiresAt && new Date(tenant.planExpiresAt).getTime() > Date.now()
        ? new Date(tenant.planExpiresAt)
        : new Date();

    const newPlanExpiresAt = new Date(basePlanExpiry.getTime() + msToAdd);
    const newMediaExpiresAt = new Date(newPlanExpiresAt.getTime() + 3 * 24 * 60 * 60 * 1000);

    const updated = await db
      .update(tenantAccounts)
      .set({
        planExpiresAt: newPlanExpiresAt,
        mediaExpiresAt: newMediaExpiresAt,
        status: "active",
        mediaCleanedUp: false,
        updatedAt: new Date(),
      })
      .where(eq(tenantAccounts.id, tenant.id))
      .returning();

    const updatedRow = updated[0];
    if (!updatedRow) {
      return c.json(error("DATABASE_ERROR", "Failed to update tenant plan"), 500);
    }

    return c.json(
      success({
        weddingId,
        planExpiresAt: updatedRow.planExpiresAt,
        mediaExpiresAt: updatedRow.mediaExpiresAt,
        status: updatedRow.status,
      })
    );
  } catch (err: any) {
    console.error("Failed to extend plan:", err);
    return c.json(error("DATABASE_ERROR", "Failed to extend tenant plan"), 500);
  }
});

// DELETE /tenant/accounts/:weddingId - Delete tenant account and customizations permanently
maintenanceRoute.delete("/accounts/:weddingId", async (c) => {
  const weddingId = c.req.param("weddingId");
  if (!weddingId) {
    return c.json(error("VALIDATION_ERROR", "Wedding ID is required"), 400);
  }

  try {
    await db.delete(tenantAccounts).where(eq(tenantAccounts.weddingId, weddingId));
    await db.delete(tenantCustomizations).where(eq(tenantCustomizations.weddingId, weddingId));

    return c.json(
      success({
        weddingId,
        message: "Tenant account and customizations deleted permanently",
      })
    );
  } catch (err: any) {
    console.error(`Failed to delete tenant account for wedding ${weddingId}:`, err);
    return c.json(error("DATABASE_ERROR", "Failed to delete tenant account"), 500);
  }
});

export default maintenanceRoute;
