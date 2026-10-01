import crypto from "node:crypto";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { tenantInvites, type TenantRegistrationDetails } from "../db/schema";

export type SubscriptionTier =
  | "12h"
  | "1day"
  | "3days"
  | "1week"
  | "1month"
  | "1year"
  | "standard"
  | "premium"
  | "vip"
  | (string & {});

export { type TenantRegistrationDetails };

export interface InviteToken {
  id: string;
  token: string;
  tier: SubscriptionTier;
  clientName?: string;
  notes?: string;
  createdAt: number;
  expiresAt: number; // 24 hours from creation
  isUsed: boolean; // strictly single-use
  usedAt?: number;
  registrationDetails?: TenantRegistrationDetails;
}

export type VerifyResult =
  | { valid: true; invite: InviteToken }
  | { valid: false; reason: "not_found" | "already_used" | "expired"; message: string };

function mapInviteRow(row: typeof tenantInvites.$inferSelect): InviteToken {
  return {
    id: row.id,
    token: row.token,
    tier: row.tier as SubscriptionTier,
    clientName: row.clientName || undefined,
    notes: row.notes || undefined,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    expiresAt: new Date(row.expiresAt).getTime(),
    isUsed: row.isUsed,
    usedAt: row.usedAt ? new Date(row.usedAt).getTime() : undefined,
    registrationDetails: row.registrationDetails || undefined,
  };
}

/**
 * Generate a new single-use invite token valid for strictly 24 hours in PostgreSQL.
 */
export async function createInviteToken(params: {
  tier: SubscriptionTier;
  clientName?: string;
  notes?: string;
}): Promise<InviteToken> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Generate a clean, secure random token (e.g. fki_a1b2c3...)
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const token = `fki_${randomBytes}`;

  const [created] = await db
    .insert(tenantInvites)
    .values({
      token,
      tier: params.tier,
      clientName: params.clientName?.trim().toLowerCase() || null,
      notes: params.notes?.trim() || null,
      createdAt: now,
      expiresAt,
      isUsed: false,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert tenant invite into database");
  }

  return mapInviteRow(created);
}

/**
 * List all invites sorted by createdAt descending.
 */
export async function listInvites(): Promise<InviteToken[]> {
  const rows = await db
    .select()
    .from(tenantInvites)
    .orderBy(desc(tenantInvites.createdAt));

  return rows.map(mapInviteRow);
}

/**
 * Find an invite by its token.
 */
export async function getInviteByToken(token: string): Promise<InviteToken | null> {
  const [row] = await db
    .select()
    .from(tenantInvites)
    .where(eq(tenantInvites.token, token))
    .limit(1);

  return row ? mapInviteRow(row) : null;
}

/**
 * Verify whether an invite token is valid, expired, or already used.
 */
export async function verifyInviteToken(token: string): Promise<VerifyResult> {
  const invite = await getInviteByToken(token);

  if (!invite) {
    return {
      valid: false,
      reason: "not_found",
      message: "Registration link does not exist or is invalid.",
    };
  }

  if (invite.isUsed) {
    return {
      valid: false,
      reason: "already_used",
      message: "This registration link has already been used (Single-Use Token).",
    };
  }

  if (Date.now() > invite.expiresAt) {
    return {
      valid: false,
      reason: "expired",
      message: "This registration link has expired (strictly valid for 24 hours). Please contact admin.",
    };
  }

  return { valid: true, invite };
}

/**
 * Redeem the invite token upon successful registration, making it single-use (burned) in PostgreSQL.
 */
export async function redeemInviteToken(
  token: string,
  details: {
    username: string;
    email: string;
    weddingId: string;
    weddingSlug: string;
    weddingName: string;
  }
): Promise<InviteToken> {
  const existing = await getInviteByToken(token);
  if (!existing) {
    throw new Error("Registration link not found.");
  }

  if (existing.isUsed) {
    throw new Error("This registration link has already been used (Single-Use Token).");
  }

  if (Date.now() > existing.expiresAt) {
    throw new Error("This registration link has expired (exceeded 24 hours).");
  }

  const registrationDetails: TenantRegistrationDetails = {
    username: details.username.trim(),
    email: details.email.trim(),
    weddingId: details.weddingId,
    weddingSlug: details.weddingSlug,
    weddingName: details.weddingName,
    registeredAt: Date.now(),
  };

  const [updated] = await db
    .update(tenantInvites)
    .set({
      isUsed: true,
      usedAt: new Date(),
      registrationDetails,
    })
    .where(and(eq(tenantInvites.token, token), eq(tenantInvites.isUsed, false)))
    .returning();

  if (!updated) {
    throw new Error("Failed to redeem invite token. It may have been used concurrently.");
  }

  return mapInviteRow(updated);
}

/**
 * Delete an invite by id (admin revoking unused link).
 */
export async function deleteInvite(id: string): Promise<boolean> {
  const deleted = await db
    .delete(tenantInvites)
    .where(eq(tenantInvites.id, id))
    .returning({ id: tenantInvites.id });

  return deleted.length > 0;
}
