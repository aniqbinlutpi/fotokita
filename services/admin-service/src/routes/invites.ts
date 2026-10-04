import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "./auth";
import {
  createInviteToken,
  listInvites,
  verifyInviteToken,
  redeemInviteToken,
  deleteInvite,
  getInviteReceipt,
  type SubscriptionTier,
} from "../lib/invites";
import { success, error } from "../lib/response";

const invitesRoute = new Hono();

// Schema for generating an invite link
const createInviteSchema = z.object({
  tier: z.string().min(1, "Please select a valid subscription plan"),
  clientName: z.string().optional(),
  notes: z.string().optional(),
  receiptData: z.string().min(1, "Payment receipt evidence is required"),
  receiptFilename: z.string().optional(),
  receiptMimeType: z.string().optional(),
});

// Schema for redeeming an invite
const redeemInviteSchema = z.object({
  token: z.string().min(1, "Token pendaftaran diperlukan"),
  username: z.string().min(2, "Username sekurang-kurangnya 2 aksara"),
  email: z.string().email("Format emel tidak sah"),
  weddingId: z.string().min(1, "Wedding ID diperlukan"),
  weddingSlug: z.string().min(1, "Wedding Slug diperlukan"),
  weddingName: z.string().min(1, "Wedding Name diperlukan"),
});

// 1. PUBLIC: Verify an invite token (Called by user on /register?token=...)
invitesRoute.get("/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json(error("TOKEN_REQUIRED", "Token pendaftaran tidak diberikan"), 400);
  }

  const result = await verifyInviteToken(token);
  if (!result.valid) {
    return c.json(
      error(
        result.reason === "already_used"
          ? "TOKEN_ALREADY_USED"
          : result.reason === "expired"
          ? "TOKEN_EXPIRED"
          : "INVALID_TOKEN",
        result.message
      ),
      400
    );
  }

  return c.json(
    success({
      valid: true,
      token: result.invite.token,
      tier: result.invite.tier,
      clientName: result.invite.clientName,
      expiresAt: result.invite.expiresAt,
      remainingMs: Math.max(0, result.invite.expiresAt - Date.now()),
    })
  );
});

// 2. PUBLIC: Redeem an invite token (Called when user submits registration)
invitesRoute.post("/redeem", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = redeemInviteSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Maklumat pendaftaran tidak lengkap", parsed.error.flatten()),
      400
    );
  }

  try {
    const redeemed = await redeemInviteToken(parsed.data.token, {
      username: parsed.data.username,
      email: parsed.data.email,
      weddingId: parsed.data.weddingId,
      weddingSlug: parsed.data.weddingSlug,
      weddingName: parsed.data.weddingName,
    });

    return c.json(
      success({
        message: "Token berjaya ditebus dan didaftarkan",
        invite: redeemed,
      })
    );
  } catch (err: any) {
    return c.json(error("REDEEM_FAILED", err?.message || "Gagal menebus token"), 400);
  }
});

// 3. ADMIN PROTECTED: List all invite tokens
invitesRoute.get("/", requireAdminAuth, async (c) => {
  const invites = await listInvites();
  const now = Date.now();

  const formatted = invites.map((inv) => {
    let status: "active" | "used" | "expired" = "active";
    if (inv.isUsed) {
      status = "used";
    } else if (now > inv.expiresAt) {
      status = "expired";
    }

    return {
      ...inv,
      status,
      remainingMinutes: Math.max(0, Math.round((inv.expiresAt - now) / 60000)),
    };
  });

  return c.json(success(formatted));
});

// 4. ADMIN PROTECTED: Generate a new invite link
invitesRoute.post("/", requireAdminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createInviteSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Sila pilih pakej subscription yang sah", parsed.error.flatten()),
      400
    );
  }

  const invite = await createInviteToken({
    tier: parsed.data.tier as SubscriptionTier,
    clientName: parsed.data.clientName,
    notes: parsed.data.notes,
    receiptData: parsed.data.receiptData,
    receiptFilename: parsed.data.receiptFilename,
    receiptMimeType: parsed.data.receiptMimeType,
  });

  return c.json(
    success({
      invite,
      invitePath: `/register?token=${invite.token}`,
      message: "24-hour registration link generated successfully",
    }),
    201
  );
});

// 5. ADMIN PROTECTED: Get payment receipt for audit
invitesRoute.get("/:id/receipt", requireAdminAuth, async (c) => {
  const id = c.req.param("id");
  const receipt = await getInviteReceipt(id);

  if (!receipt || !receipt.receiptData) {
    return c.json(error("NOT_FOUND", "Payment receipt not found for this invite"), 404);
  }

  return c.json(success(receipt));
});

// 6. ADMIN PROTECTED: Delete / revoke invite
invitesRoute.delete("/:id", requireAdminAuth, async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteInvite(id);
  if (!deleted) {
    return c.json(error("NOT_FOUND", "Invite link not found"), 404);
  }
  return c.json(success({ message: "Invite link revoked successfully" }));
});

export default invitesRoute;

