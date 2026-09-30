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
  username: z.string().min(1, "Username diperlukan"),
  password: z.string().min(1, "Password diperlukan"),
});

export const requireAdminAuth = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(error("UNAUTHORIZED", "Sila log masuk untuk mengakses panel admin"), 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json(error("INVALID_TOKEN", "Sesi telah tamat atau tidak sah"), 401);
  }

  c.set("admin", payload);
  await next();
};

authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Data log masuk tidak lengkap", parsed.error.flatten()),
      400
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME || "superadmin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "fotokitaAdmin2026!";

  const { username, password } = parsed.data;

  // Verify username & password
  if (username !== expectedUsername || password !== expectedPassword) {
    return c.json(error("INVALID_CREDENTIALS", "Username atau password tidak tepat"), 401);
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

authRoute.post("/logout", async (c) => {
  return c.json(success({ message: "Log keluar berjaya" }));
});

export default authRoute;
