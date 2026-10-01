import { Hono } from "hono";
import { z } from "zod";
import { createToken, verifyToken, type AdminPayload } from "../lib/auth";
import { success, error } from "../lib/response";

type Env = {
  Variables: {
    admin: AdminPayload;
  };
};

const authRoute = new Hono<Env>();

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const requireAdminAuth = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(error("UNAUTHORIZED", "Please log in to access the admin panel"), 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json(error("INVALID_TOKEN", "Session expired or invalid token"), 401);
  }

  c.set("admin", payload);
  await next();
};

authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Incomplete login credentials", parsed.error.flatten()),
      400
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  const { username, password } = parsed.data;

  // Verify username & password
  if (username !== expectedUsername || password !== expectedPassword) {
    return c.json(error("INVALID_CREDENTIALS", "Invalid username or password"), 401);
  }

  const token = await createToken({
    username: expectedUsername,
    role: "superadmin",
    name: "Super Admin",
  });

  return c.json(
    success({
      token,
      user: {
        username: expectedUsername,
        role: "superadmin",
        name: "Super Admin",
      },
    })
  );
});

authRoute.get("/me", requireAdminAuth, async (c) => {
  const admin = c.get("admin") as AdminPayload;
  return c.json(
    success({
      user: {
        username: admin.username,
        role: admin.role,
        name: admin.name,
      },
    })
  );
});

authRoute.post("/verify-password", requireAdminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const verifySchema = z.object({
    password: z.string().min(1, "Password is required"),
  });
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return c.json(error("VALIDATION_ERROR", "Sila masukkan kata laluan admin"), 400);
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || parsed.data.password !== expectedPassword) {
    return c.json(
      error("INVALID_PASSWORD", "Kata laluan Super Admin tidak tepat. Pengesahan gagal."),
      403
    );
  }

  return c.json(success({ verified: true }));
});

authRoute.post("/logout", async (c) => {
  return c.json(success({ message: "Successfully logged out" }));
});

export default authRoute;
