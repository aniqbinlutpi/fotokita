import { timingSafeEqual } from "node:crypto";
import { error } from "./response";

function isValidServiceKey(provided: string | undefined): boolean {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || !provided) return false; // unset key = service-to-service access is off
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Allows a trusted backend call (x-service-key = INTERNAL_API_KEY, used by tenant-service's
 * retention worker) or a superadmin session. Admin tokens are verified by admin-service.
 */
export const requireAdminOrService = async (c: any, next: () => Promise<void>) => {
  if (isValidServiceKey(c.req.header("x-service-key"))) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(error("UNAUTHORIZED", "Admin login or service key required"), 401);
  }

  const adminServiceUrl = process.env.ADMIN_SERVICE_URL || "http://localhost:3002";
  let res: Response;
  try {
    res = await fetch(`${adminServiceUrl}/admin/auth/me`, { headers: { Authorization: authHeader } });
  } catch (err) {
    console.error("Admin auth check failed (admin-service unreachable):", err);
    return c.json(error("SERVICE_UNAVAILABLE", "Could not verify admin session"), 503);
  }

  if (!res.ok) {
    return c.json(error("UNAUTHORIZED", "Admin login or service key required"), 401);
  }
  return next();
};
