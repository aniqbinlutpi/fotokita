import { Hono } from "hono";
import { z } from "zod";
import { success, error } from "../lib/response";
import { verifyTenantToken } from "../lib/auth";
import { requireTenantAuth } from "./auth";
import { resolveWedding } from "../services/wedding-resolver.service";
import { getInvitation, upsertInvitation } from "../services/invitation.service";
import type { TenantPayload } from "../lib/auth";

const invitationRoute = new Hono<{ Variables: { tenant: TenantPayload } }>();

const coord = (min: number, max: number) =>
  z
    .string()
    .trim()
    .nullable()
    .refine((v) => v === null || v === "" || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max), {
      message: `Must be a number between ${min} and ${max}`,
    })
    .transform((v) => (v ? v : null));

const updateInvitationSchema = z.object({
  enabled: z.boolean(),
  openingGreeting: z.string().trim().max(120),
  hostNames: z.string().trim().max(500),
  inviteMessage: z.string().trim().max(1000),
  eventStart: z.coerce.date().nullable(),
  eventEnd: z.coerce.date().nullable(),
  venueName: z.string().trim().max(200),
  venueAddress: z.string().trim().max(500),
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  schedule: z
    .array(z.object({ time: z.string().trim().max(30), title: z.string().trim().min(1).max(120) }))
    .max(15),
  contacts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        role: z.string().trim().max(60),
        phone: z.string().trim().regex(/^\+?[0-9 -]{7,20}$/, "Invalid phone number"),
      })
    )
    .max(6),
  musicUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .refine((v) => !v || v.startsWith("https://") || /^\/music\/[\w.-]+$/.test(v), {
      message: "Must be an https URL or a /music/ preset",
    })
    .transform((v) => (v ? v : null)),
  cardStyle: z.enum(["classic", "floral", "minimal"]),
});

async function isOwner(authHeader: string | undefined, weddingId: string): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const payload = await verifyTenantToken(authHeader.split(" ")[1] ?? "");
  return payload?.weddingId === weddingId;
}

// Public; a disabled invitation is only visible to its owner (portal preview)
invitationRoute.get("/:identifier", async (c) => {
  const { weddingId } = await resolveWedding(c.req.param("identifier"));
  const invitation = await getInvitation(weddingId);

  if (!invitation || (!invitation.enabled && !(await isOwner(c.req.header("Authorization"), weddingId)))) {
    return c.json(error("NOT_FOUND", "Invitation not found"), 404);
  }
  return c.json(success(invitation));
});

invitationRoute.put("/:identifier", requireTenantAuth, async (c) => {
  const { weddingId } = await resolveWedding(c.req.param("identifier"));
  const tenant = c.get("tenant");
  if (tenant.weddingId !== weddingId) {
    return c.json(error("FORBIDDEN", "You can only edit your own invitation"), 403);
  }

  const parsed = updateInvitationSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(error("VALIDATION_ERROR", "Invalid invitation payload", parsed.error.flatten()), 400);
  }

  return c.json(success(await upsertInvitation(weddingId, parsed.data)));
});

export default invitationRoute;
