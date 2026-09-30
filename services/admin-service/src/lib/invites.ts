import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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

export interface TenantRegistrationDetails {
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  registeredAt: number;
}

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

const DATA_DIR = path.resolve(import.meta.dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "invites.json");

// Ensure data storage directory exists
async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to initialize invite data file:", err);
  }
}

async function readAllInvites(): Promise<InviteToken[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as InviteToken[];
  } catch (err) {
    console.error("Failed to read invites:", err);
    return [];
  }
}

async function writeAllInvites(invites: InviteToken[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(invites, null, 2), "utf-8");
}

/**
 * Generate a new single-use invite token valid for strictly 24 hours.
 */
export async function createInviteToken(params: {
  tier: SubscriptionTier;
  clientName?: string;
  notes?: string;
}): Promise<InviteToken> {
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  // Generate a clean, secure random token (e.g. fki_a1b2c3...)
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const token = `fki_${randomBytes}`;

  const invite: InviteToken = {
    id: crypto.randomUUID(),
    token,
    tier: params.tier,
    clientName: params.clientName?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    createdAt: now,
    expiresAt: now + TWENTY_FOUR_HOURS_MS,
    isUsed: false,
  };

  const all = await readAllInvites();
  all.unshift(invite);
  await writeAllInvites(all);

  return invite;
}

/**
 * List all invites sorted by createdAt descending.
 */
export async function listInvites(): Promise<InviteToken[]> {
  return readAllInvites();
}

/**
 * Find an invite by its token.
 */
export async function getInviteByToken(token: string): Promise<InviteToken | null> {
  const all = await readAllInvites();
  return all.find((i) => i.token === token) || null;
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
      message: "Link jemputan pendaftaran tidak wujud atau tidak sah.",
    };
  }

  if (invite.isUsed) {
    return {
      valid: false,
      reason: "already_used",
      message: "Link ini telah pun digunakan untuk pendaftaran sebelum ini (Single-Use Token).",
    };
  }

  if (Date.now() > invite.expiresAt) {
    return {
      valid: false,
      reason: "expired",
      message: "Link pendaftaran ini telah tamat tempoh (sah selama 24 jam sahaja). Sila minta link baru.",
    };
  }

  return { valid: true, invite };
}

/**
 * Redeem the invite token upon successful registration, making it single-use (burned).
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
  const all = await readAllInvites();
  const index = all.findIndex((i) => i.token === token);

  if (index === -1) {
    throw new Error("Link pendaftaran tidak dijumpai.");
  }

  const invite = all[index];
  if (!invite) {
    throw new Error("Link pendaftaran tidak dijumpai.");
  }

  if (invite.isUsed) {
    throw new Error("Link ini telah pun digunakan (Single-Use Token).");
  }

  if (Date.now() > invite.expiresAt) {
    throw new Error("Link pendaftaran ini telah tamat tempoh (melebihi 24 jam).");
  }

  const updatedInvite: InviteToken = {
    ...invite,
    isUsed: true,
    usedAt: Date.now(),
    registrationDetails: {
      username: details.username.trim(),
      email: details.email.trim(),
      weddingId: details.weddingId,
      weddingSlug: details.weddingSlug,
      weddingName: details.weddingName,
      registeredAt: Date.now(),
    },
  };

  all[index] = updatedInvite;
  await writeAllInvites(all);

  return updatedInvite;
}

/**
 * Delete an invite by id (admin revoking unused link).
 */
export async function deleteInvite(id: string): Promise<boolean> {
  const all = await readAllInvites();
  const filtered = all.filter((i) => i.id !== id);
  if (filtered.length === all.length) return false;
  await writeAllInvites(filtered);
  return true;
}
