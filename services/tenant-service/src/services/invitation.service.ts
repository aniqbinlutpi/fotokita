import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenantInvitations, type TenantInvitation } from "../db/schema";

export type InvitationInput = Omit<TenantInvitation, "id" | "weddingId" | "updatedAt">;

export async function getInvitation(weddingId: string): Promise<TenantInvitation | null> {
  const rows = await db
    .select()
    .from(tenantInvitations)
    .where(eq(tenantInvitations.weddingId, weddingId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertInvitation(
  weddingId: string,
  input: InvitationInput
): Promise<TenantInvitation> {
  const values = { ...input, updatedAt: new Date() };
  const rows = await db
    .insert(tenantInvitations)
    .values({ weddingId, ...values })
    .onConflictDoUpdate({ target: tenantInvitations.weddingId, set: values })
    .returning();
  return rows[0]!;
}
