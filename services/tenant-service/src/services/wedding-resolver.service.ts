import { eq, or, sql } from "drizzle-orm";
import { db } from "../db";
import { tenantAccounts } from "../db/schema";

// Helper to resolve an identifier (weddingId or slug) to actual weddingId & weddingSlug
export async function resolveWedding(identifier: string): Promise<{ weddingId: string; slug?: string; name?: string }> {
  let decoded = identifier;
  try {
    decoded = decodeURIComponent(identifier);
  } catch {
    // ignore
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = uuidRegex.test(identifier) || uuidRegex.test(decoded);
  const targetId = isUuid ? (uuidRegex.test(identifier) ? identifier : decoded) : identifier;

  // 1. First check tenantAccounts in PostgreSQL
  try {
    const matchedTenants = await db
      .select()
      .from(tenantAccounts)
      .where(
        isUuid
          ? eq(tenantAccounts.weddingId, targetId)
          : or(
              eq(tenantAccounts.weddingSlug, identifier),
              eq(tenantAccounts.weddingSlug, decoded),
              sql`LOWER(${tenantAccounts.weddingSlug}) = ${identifier.toLowerCase()}`,
              sql`LOWER(${tenantAccounts.weddingSlug}) = ${decoded.toLowerCase()}`
            )
      )
      .limit(1);

    const matched = matchedTenants[0];
    if (matched) {
      return {
        weddingId: matched.weddingId,
        slug: matched.weddingSlug,
        name: matched.weddingName,
      };
    }
  } catch (err) {
    console.warn("Could not query tenant_accounts for identifier resolution:", err);
  }

  // 2. Query wedding-service by slug or id
  const weddingServiceUrl = process.env.WEDDING_SERVICE_URL || "http://localhost:3001";
  try {
    const endpoint = isUuid
      ? `${weddingServiceUrl}/weddings/${encodeURIComponent(targetId)}`
      : `${weddingServiceUrl}/weddings/slug/${encodeURIComponent(decoded)}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const body = (await res.json()) as any;
      if (body?.data?.id) {
        return {
          weddingId: body.data.id,
          slug: body.data.slug,
          name: body.data.name,
        };
      }
    }
  } catch (err) {
    console.warn("Could not query wedding-service for identifier resolution:", err);
  }

  return { weddingId: identifier, slug: identifier };
}
