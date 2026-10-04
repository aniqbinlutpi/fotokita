import { and, eq, lte, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import { tenantAccounts } from "../db/schema";

export interface CleanupResult {
  processedCount: number;
  cleanedTenants: Array<{
    id: string;
    username: string;
    weddingId: string;
    weddingName: string;
    mediaExpiresAt: Date | null;
  }>;
  errors: Array<{
    weddingId: string;
    error: string;
  }>;
}

export async function runMediaRetentionCleanup(): Promise<CleanupResult> {
  const mediaServiceUrl = process.env.MEDIA_SERVICE_URL || "http://localhost:3002";
  const now = new Date();

  console.log(`🧹 [Retention Cleanup] Checking for expired media at ${now.toISOString()}...`);

  // Query all accounts where grace period has passed, media not yet cleaned, and admin hasn't set preserveMedia
  const expiredTenants = await db
    .select()
    .from(tenantAccounts)
    .where(
      and(
        eq(tenantAccounts.mediaCleanedUp, false),
        eq(tenantAccounts.preserveMedia, false),
        isNotNull(tenantAccounts.mediaExpiresAt),
        lte(tenantAccounts.mediaExpiresAt, now)
      )
    );

  const result: CleanupResult = {
    processedCount: expiredTenants.length,
    cleanedTenants: [],
    errors: [],
  };

  if (expiredTenants.length === 0) {
    console.log("🧹 [Retention Cleanup] No expired tenant media to clean up.");
    return result;
  }

  console.log(`🧹 [Retention Cleanup] Found ${expiredTenants.length} tenant account(s) ready for media cleanup.`);

  for (const tenant of expiredTenants) {
    try {
      console.log(
        `🧹 [Retention Cleanup] Purging S3 and database media for weddingId=${tenant.weddingId} (${tenant.weddingName})...`
      );

      // Call Media Service batch delete endpoint
      const res = await fetch(`${mediaServiceUrl}/media/wedding/${encodeURIComponent(tenant.weddingId)}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 404) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Media service returned ${res.status}: ${errorText}`);
      }

      // Mark tenant as media cleaned up and archived (RETAIN tenant record in database!)
      await db
        .update(tenantAccounts)
        .set({
          mediaCleanedUp: true,
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(tenantAccounts.id, tenant.id));

      result.cleanedTenants.push({
        id: tenant.id,
        username: tenant.username,
        weddingId: tenant.weddingId,
        weddingName: tenant.weddingName,
        mediaExpiresAt: tenant.mediaExpiresAt,
      });

      console.log(`✅ [Retention Cleanup] Successfully cleaned media for ${tenant.weddingName}. Tenant record archived.`);
    } catch (err: any) {
      console.error(`❌ [Retention Cleanup] Failed to cleanup media for weddingId=${tenant.weddingId}:`, err);
      result.errors.push({
        weddingId: tenant.weddingId,
        error: err?.message || String(err),
      });
    }
  }

  return result;
}
