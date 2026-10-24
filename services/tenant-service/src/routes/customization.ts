import { Hono } from "hono";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { success, error } from "../lib/response";
import { db } from "../db";
import { tenantCustomizations, tenantAccounts, type TenantCustomization } from "../db/schema";
import { requireTenantAuth } from "./auth";
import { resolveWedding } from "../services/wedding-resolver.service";

const customizationRoute = new Hono();

const updateCustomizationSchema = z.object({
  partner1: z.string().optional(),
  partner2: z.string().optional(),
  weddingDate: z.string().optional(),
  eyebrow: z.string().optional(),
  tagline: z.string().optional(),
  themePalette: z.string().optional(),
  fireworksEnabled: z.boolean().optional(),
  orbStyle: z.string().optional(),
  fontPreset: z.string().optional(),
  partnerFont: z.string().optional(),
  partnerSize: z.string().optional(),
  eyebrowFont: z.string().optional(),
  eyebrowSize: z.string().optional(),
  dateFont: z.string().optional(),
  dateSize: z.string().optional(),
  quoteFont: z.string().optional(),
  quoteSize: z.string().optional(),
  ampersandSize: z.string().optional(),
  orbSize: z.string().optional(),
  textPositions: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  slug: z.string().optional(),
});

// GET customization for a wedding (by weddingId or slug)
customizationRoute.get("/:identifier", async (c) => {
  const param = c.req.param("identifier");
  const { weddingId, slug: resolvedSlug, name: resolvedName, date: resolvedDate } = await resolveWedding(param);

  let defaultWeddingDate = "";
  if (resolvedDate) {
    try {
      defaultWeddingDate = new Date(resolvedDate).toISOString().split("T")[0] || "";
    } catch {
      defaultWeddingDate = resolvedDate.split("T")[0] || "";
    }
  }

  let customization: TenantCustomization | null = null;
  try {
    const rows = await db
      .select()
      .from(tenantCustomizations)
      .where(eq(tenantCustomizations.weddingId, weddingId))
      .limit(1);

    if (rows.length > 0 && rows[0]) {
      customization = rows[0];
    }
  } catch (err: any) {
    console.error("Database query failed in GET /customization:", err);
    return c.json(error("DATABASE_ERROR", "Failed to retrieve wedding customization"), 500);
  }

  // Extract initial partner names from resolvedName if present
  let defaultPartner1 = "";
  let defaultPartner2 = "";
  if (resolvedName) {
    if (resolvedName.includes("&")) {
      const parts = resolvedName.split("&").map((p) => p.trim());
      defaultPartner1 = parts[0] || "";
      defaultPartner2 = parts[1] || "";
    } else if (resolvedName.includes("and")) {
      const parts = resolvedName.split("and").map((p) => p.trim());
      defaultPartner1 = parts[0] || "";
      defaultPartner2 = parts[1] || "";
    } else {
      defaultPartner1 = resolvedName;
      defaultPartner2 = "";
    }
  }

  // If not found in DB yet, create initial default row in PostgreSQL
  if (!customization) {
    try {
      const inserted = await db
        .insert(tenantCustomizations)
        .values({
          weddingId,
          partner1: defaultPartner1,
          partner2: defaultPartner2,
          weddingDate: defaultWeddingDate || "",
          eyebrow: "- WEDDING ARCHIVE -",
          tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
          themePalette: "warmGold",
          fireworksEnabled: true,
          orbStyle: "warmGoldChocolate",
          fontPreset: "editorial-serif",
          partnerFont: "cormorant",
          partnerSize: "72",
          eyebrowFont: "inter",
          eyebrowSize: "12",
          dateFont: "inter",
          dateSize: "13",
          quoteFont: "cormorant",
          quoteSize: "18",
          ampersandSize: "380",
          orbSize: "130",
        })
        .returning();

      customization = inserted[0] || null;
    } catch {
      // Fallback in-memory object if insert had constraint collision
      customization = {
        id: weddingId,
        weddingId,
        partner1: defaultPartner1,
        partner2: defaultPartner2,
        weddingDate: defaultWeddingDate || "",
        eyebrow: "- WEDDING ARCHIVE -",
        tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
        themePalette: "warmGold",
        fireworksEnabled: true,
        orbStyle: "warmGoldChocolate",
        fontPreset: "editorial-serif",
        partnerFont: "cormorant",
        partnerSize: "72",
        eyebrowFont: "inter",
        eyebrowSize: "12",
        dateFont: "inter",
        dateSize: "13",
        quoteFont: "cormorant",
        quoteSize: "18",
        ampersandSize: "380",
        orbSize: "130",
        textPositions: null as string | null,
        updatedAt: new Date(),
      };
    }
  }

  const active = customization || {
    weddingId,
    partner1: defaultPartner1,
    partner2: defaultPartner2,
    weddingDate: defaultWeddingDate || "",
    eyebrow: "- WEDDING ARCHIVE -",
    tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
    themePalette: "warmGold",
    fireworksEnabled: true,
    orbStyle: "warmGoldChocolate",
    fontPreset: "editorial-serif",
    partnerFont: "cormorant",
    partnerSize: "72",
    eyebrowFont: "inter",
    eyebrowSize: "12",
    dateFont: "inter",
    dateSize: "13",
    quoteFont: "cormorant",
    quoteSize: "18",
    ampersandSize: "380",
    orbSize: "130",
    textPositions: null as string | null,
  };

  // If saved weddingDate is the legacy placeholder "2026-10-30" but we have real resolvedDate, use real date
  const finalWeddingDate =
    (active.weddingDate && active.weddingDate !== "2026-10-30" ? active.weddingDate : "") ||
    defaultWeddingDate ||
    active.weddingDate ||
    "";

  return c.json(
    success({
      weddingId: active.weddingId,
      partner1: active.partner1 || defaultPartner1,
      partner2: active.partner2 || defaultPartner2,
      weddingDate: finalWeddingDate,
      eyebrow: active.eyebrow || "- WEDDING ARCHIVE -",
      tagline: active.tagline || "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
      themePalette: active.themePalette || "warmGold",
      fireworksEnabled: typeof active.fireworksEnabled === "boolean" ? active.fireworksEnabled : true,
      orbStyle: active.orbStyle || "warmGoldChocolate",
      fontPreset: active.fontPreset || "editorial-serif",
      partnerFont: active.partnerFont || "cormorant",
      partnerSize: active.partnerSize || "72",
      eyebrowFont: active.eyebrowFont || "inter",
      eyebrowSize: active.eyebrowSize || "12",
      dateFont: active.dateFont || "inter",
      dateSize: active.dateSize || "13",
      quoteFont: active.quoteFont || "cormorant",
      quoteSize: active.quoteSize || "18",
      ampersandSize: active.ampersandSize || "380",
      orbSize: active.orbSize || "130",
      textPositions: active.textPositions
        ? typeof active.textPositions === "string"
          ? (() => {
              try {
                return JSON.parse(active.textPositions);
              } catch {
                return active.textPositions;
              }
            })()
          : active.textPositions
        : null,
      slug: resolvedSlug,
    })
  );
});

// PUT / UPDATE customization (requires sub-admin authentication)
customizationRoute.put("/:identifier", requireTenantAuth, async (c) => {
  const param = c.req.param("identifier");
  const { weddingId, slug: existingSlug } = await resolveWedding(param);

  const body = await c.req.json().catch(() => null);
  const parsed = updateCustomizationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Invalid customization payload", parsed.error.flatten()),
      400
    );
  }

  const data = parsed.data;

  // Sync couple names & date & slug to wedding-service
  const weddingServiceUrl = process.env.WEDDING_SERVICE_URL || "http://localhost:3001";
  let syncedSlug = data.slug?.trim().toLowerCase() || existingSlug;

  try {
    const combinedName =
      data.partner1 && data.partner2
        ? `${data.partner1.trim()} & ${data.partner2.trim()}`
        : data.partner1?.trim() || undefined;

    const patchPayload: Record<string, any> = {};
    if (combinedName) patchPayload.name = combinedName;
    if (data.weddingDate) patchPayload.date = new Date(data.weddingDate).toISOString();
    if (data.slug?.trim()) {
      patchPayload.slug = data.slug.trim().toLowerCase();
    }

    if (Object.keys(patchPayload).length > 0) {
      const patchRes = await fetch(`${weddingServiceUrl}/weddings/${encodeURIComponent(weddingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      });

      if (patchRes.ok) {
        const patchData = (await patchRes.json()) as any;
        if (patchData?.data?.slug) {
          syncedSlug = patchData.data.slug;
        }
      }
    }
  } catch (err) {
    console.warn("Could not sync with wedding-service:", err);
  }

  // Update tenant_accounts record in PostgreSQL if slug or name changed
  try {
    const accountUpdates: Record<string, any> = { updatedAt: new Date() };
    if (syncedSlug) accountUpdates.weddingSlug = syncedSlug;
    if (data.partner1 && data.partner2) {
      accountUpdates.weddingName = `${data.partner1.trim()} & ${data.partner2.trim()}`;
    }
    await db
      .update(tenantAccounts)
      .set(accountUpdates)
      .where(eq(tenantAccounts.weddingId, weddingId));
  } catch (err) {
    console.warn("Failed to update tenant_accounts:", err);
  }

  // Persist customization in PostgreSQL using Drizzle ORM upsert
  let savedCustomization: TenantCustomization | null = null;
  const textPositionsStr =
    data.textPositions !== undefined
      ? typeof data.textPositions === "string"
        ? data.textPositions
        : JSON.stringify(data.textPositions)
      : undefined;

  try {
    const insertValues: any = {
      weddingId,
      partner1: data.partner1 ?? "",
      partner2: data.partner2 ?? "",
      weddingDate: data.weddingDate ?? "2026-10-30",
      eyebrow: data.eyebrow ?? "- WEDDING ARCHIVE -",
      tagline: data.tagline ?? "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
      themePalette: data.themePalette ?? "warmGold",
      fireworksEnabled: data.fireworksEnabled ?? true,
      orbStyle: data.orbStyle ?? "warmGoldChocolate",
      fontPreset: data.fontPreset ?? "editorial-serif",
      partnerFont: data.partnerFont ?? "cormorant",
      partnerSize: data.partnerSize ?? "72",
      eyebrowFont: data.eyebrowFont ?? "inter",
      eyebrowSize: data.eyebrowSize ?? "12",
      dateFont: data.dateFont ?? "inter",
      dateSize: data.dateSize ?? "13",
      quoteFont: data.quoteFont ?? "cormorant",
      quoteSize: data.quoteSize ?? "18",
      ampersandSize: data.ampersandSize ?? "380",
      orbSize: data.orbSize ?? "130",
      updatedAt: new Date(),
    };
    if (textPositionsStr !== undefined) {
      insertValues.textPositions = textPositionsStr;
    }

    const updateSet: any = {
      partner1: data.partner1,
      partner2: data.partner2,
      weddingDate: data.weddingDate,
      eyebrow: data.eyebrow,
      tagline: data.tagline,
      themePalette: data.themePalette,
      fireworksEnabled: data.fireworksEnabled,
      orbStyle: data.orbStyle,
      fontPreset: data.fontPreset,
      partnerFont: data.partnerFont,
      partnerSize: data.partnerSize,
      eyebrowFont: data.eyebrowFont,
      eyebrowSize: data.eyebrowSize,
      dateFont: data.dateFont,
      dateSize: data.dateSize,
      quoteFont: data.quoteFont,
      quoteSize: data.quoteSize,
      ampersandSize: data.ampersandSize,
      orbSize: data.orbSize,
      updatedAt: new Date(),
    };
    if (textPositionsStr !== undefined) {
      updateSet.textPositions = textPositionsStr;
    }

    const rows = await db
      .insert(tenantCustomizations)
      .values(insertValues)
      .onConflictDoUpdate({
        target: tenantCustomizations.weddingId,
        set: updateSet,
      })
      .returning();

    savedCustomization = rows[0] || null;
  } catch (err: any) {
    console.error("Database upsert failed in PUT /customization:", err);
    return c.json(error("DATABASE_ERROR", "Failed to persist customization to database"), 500);
  }

  if (!savedCustomization) {
    return c.json(error("DATABASE_ERROR", "Failed to retrieve saved customization"), 500);
  }

  return c.json(
    success({
      weddingId: savedCustomization.weddingId,
      partner1: savedCustomization.partner1,
      partner2: savedCustomization.partner2,
      weddingDate: savedCustomization.weddingDate,
      eyebrow: savedCustomization.eyebrow,
      tagline: savedCustomization.tagline,
      themePalette: savedCustomization.themePalette,
      fireworksEnabled: savedCustomization.fireworksEnabled,
      orbStyle: savedCustomization.orbStyle,
      fontPreset: savedCustomization.fontPreset,
      partnerFont: savedCustomization.partnerFont,
      partnerSize: savedCustomization.partnerSize,
      eyebrowFont: savedCustomization.eyebrowFont,
      eyebrowSize: savedCustomization.eyebrowSize,
      dateFont: savedCustomization.dateFont,
      dateSize: savedCustomization.dateSize,
      quoteFont: savedCustomization.quoteFont,
      quoteSize: savedCustomization.quoteSize,
      ampersandSize: savedCustomization.ampersandSize || "380",
      orbSize: savedCustomization.orbSize || "130",
      textPositions: savedCustomization.textPositions
        ? typeof savedCustomization.textPositions === "string"
          ? (() => {
              try {
                return JSON.parse(savedCustomization.textPositions);
              } catch {
                return savedCustomization.textPositions;
              }
            })()
          : savedCustomization.textPositions
        : null,
      slug: syncedSlug,
    })
  );
});

export default customizationRoute;
