import { error } from "./response";

/**
 * Guards superadmin-only routes. Admin sessions are issued by admin-service, so the token is
 * checked there (GET /admin/auth/me) instead of sharing its signing secret across services.
 */
export const requireAdminAuth = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(error("UNAUTHORIZED", "Admin login required"), 401);
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
    return c.json(error("UNAUTHORIZED", "Admin login required"), 401);
  }
  await next();
};
