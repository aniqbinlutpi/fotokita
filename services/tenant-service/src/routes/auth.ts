import { Hono } from "hono";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { createTenantToken, verifyTenantToken, type TenantPayload } from "../lib/auth";
import { success, error } from "../lib/response";
import { db } from "../db";
import { tenantAccounts, tenantCustomizations } from "../db/schema";
import { calculatePlanDates } from "../utils/duration";

type Env = {
  Variables: {
    tenant: TenantPayload;
  };
};

const authRoute = new Hono<Env>();

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(2, "Username mestilah sekurang-kurangnya 2 aksara"),
  email: z.string().email("Emel tidak sah").optional().or(z.literal("")),
  password: z.string().min(4, "Kata laluan atau PIN mestilah sekurang-kurangnya 4 aksara"),
  weddingId: z.string().min(1, "Wedding ID diperlukan"),
  weddingSlug: z.string().min(1, "Wedding slug diperlukan"),
  weddingName: z.string().min(1, "Wedding name diperlukan"),
  planTier: z.string().optional().default("1day"),
});

export const requireTenantAuth = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(error("UNAUTHORIZED", "Please log in to access your sub-admin portal"), 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyTenantToken(token);

  if (!payload) {
    return c.json(error("INVALID_TOKEN", "Session expired or invalid token"), 401);
  }

  c.set("tenant", payload);
  await next();
};

async function syncWithWeddingService(weddingId: string, currentSlug: string, currentName: string) {
  const weddingServiceUrl = process.env.WEDDING_SERVICE_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${weddingServiceUrl}/weddings/${encodeURIComponent(weddingId)}`);
    if (res.ok) {
      const body = (await res.json()) as any;
      if (body?.data) {
        return {
          slug: body.data.slug || currentSlug,
          name: body.data.name || currentName,
        };
      }
    }
  } catch {
    // Service offline or not reachable
  }
  return { slug: currentSlug, name: currentName };
}

// POST /tenant/auth/register - Register newly created tenant account with chosen username & password
authRoute.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Sila lengkapkan maklumat pendaftaran akaun", parsed.error.flatten()),
      400
    );
  }

  const { username, email, password, weddingId, weddingSlug, weddingName } = parsed.data;
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUsername}@fotokita.my`).trim().toLowerCase();
  const cleanPassword = password.trim();
  const planTier = (parsed.data.planTier || "1day").trim().toLowerCase();
  const { planExpiresAt, mediaExpiresAt } = calculatePlanDates(planTier);

  // Check if username or email is already registered to a DIFFERENT wedding
  try {
    const existing = await db
      .select()
      .from(tenantAccounts)
      .where(
        or(
          sql`LOWER(${tenantAccounts.username}) = ${cleanUsername}`,
          sql`LOWER(${tenantAccounts.email}) = ${cleanEmail}`,
          eq(tenantAccounts.weddingId, weddingId)
        )
      );

    const collision = existing.find(
      (acc) => acc.weddingId !== weddingId && (acc.username.toLowerCase() === cleanUsername || acc.email.toLowerCase() === cleanEmail)
    );

    if (collision) {
      return c.json(
        error(
          "USERNAME_EXISTS",
          "Username atau emel ini telah didaftarkan oleh majlis lain. Sila gunakan username atau emel yang berbeza."
        ),
        409
      );
    }
  } catch (err: any) {
    console.error("Database check failed in /register:", err);
    return c.json(error("DATABASE_ERROR", "Ralat memeriksa pangkalan data akaun"), 500);
  }

  // Insert or update tenant_accounts with registered credentials
  let registeredAccount;
  try {
    const rows = await db
      .insert(tenantAccounts)
      .values({
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        weddingId,
        weddingSlug: weddingSlug.trim().toLowerCase(),
        weddingName: weddingName.trim(),
        planTier,
        planExpiresAt,
        mediaExpiresAt,
        preserveMedia: false,
        status: "active",
        mediaCleanedUp: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tenantAccounts.username,
        set: {
          password: cleanPassword,
          email: cleanEmail,
          weddingId,
          weddingSlug: weddingSlug.trim().toLowerCase(),
          weddingName: weddingName.trim(),
          planTier,
          planExpiresAt,
          mediaExpiresAt,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning();

    registeredAccount = rows[0];
  } catch (err: any) {
    console.error("Database insert failed in /register:", err);
    return c.json(error("DATABASE_ERROR", "Gagal menyimpan akaun pendaftaran ke pangkalan data"), 500);
  }

  if (!registeredAccount) {
    return c.json(error("DATABASE_ERROR", "Pendaftaran akaun gagal diproses"), 500);
  }

  // Also initialize tenant_customizations row with couple names parsed from weddingName
  try {
    let p1 = "Wan";
    let p2 = "Three";
    if (weddingName.includes("&")) {
      const parts = weddingName.split("&").map((s) => s.trim());
      if (parts[0]) p1 = parts[0];
      if (parts[1]) p2 = parts[1];
    }

    await db
      .insert(tenantCustomizations)
      .values({
        weddingId,
        partner1: p1,
        partner2: p2,
        weddingDate: "2026-10-30",
        eyebrow: "- WEDDING ARCHIVE -",
        tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
        themePalette: "warmGold",
        fireworksEnabled: true,
        orbStyle: "warmGoldChocolate",
        fontPreset: "editorial-serif",
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  } catch (err) {
    console.warn("Could not seed tenant_customizations on register:", err);
  }

  // Create JWT session token
  const token = await createTenantToken({
    tenantId: registeredAccount.id,
    username: registeredAccount.username,
    email: registeredAccount.email,
    weddingId: registeredAccount.weddingId,
    weddingSlug: registeredAccount.weddingSlug,
    weddingName: registeredAccount.weddingName,
  });

  return c.json(
    success({
      token,
      tenant: {
        id: registeredAccount.id,
        username: registeredAccount.username,
        email: registeredAccount.email,
        weddingId: registeredAccount.weddingId,
        weddingSlug: registeredAccount.weddingSlug,
        weddingName: registeredAccount.weddingName,
        planTier: registeredAccount.planTier,
        planExpiresAt: registeredAccount.planExpiresAt,
        mediaExpiresAt: registeredAccount.mediaExpiresAt,
        preserveMedia: registeredAccount.preserveMedia,
        status: registeredAccount.status,
      },
    }),
    201
  );
});

// POST /tenant/auth/login - Log in taking username/email and registered password
authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Sila masukkan username atau emel berserta kata laluan", parsed.error.flatten()),
      400
    );
  }

  const { identifier, password } = parsed.data;
  const cleanId = identifier.trim().toLowerCase();
  const inputPassword = password.trim();

  // Find tenant by registered username, registered email, or wedding slug
  let tenantList;
  try {
    tenantList = await db
      .select()
      .from(tenantAccounts)
      .where(
        or(
          sql`LOWER(${tenantAccounts.username}) = ${cleanId}`,
          sql`LOWER(${tenantAccounts.email}) = ${cleanId}`,
          sql`LOWER(${tenantAccounts.weddingSlug}) = ${cleanId}`
        )
      )
      .limit(1);
  } catch (err: any) {
    console.error("Database query failed in /login:", err);
    return c.json(error("DATABASE_ERROR", "Ralat menyemak pangkalan data akaun"), 500);
  }

  const tenant = tenantList[0];

  if (!tenant) {
    return c.json(
      error(
        "INVALID_CREDENTIALS",
        "Akaun tidak dijumpai dengan username atau emel yang diberikan. Sila semak pendaftaran anda."
      ),
      401
    );
  }

  // Strictly validate registered password / PIN from database
  const isMatch = tenant.password === inputPassword;

  if (!isMatch) {
    return c.json(
      error(
        "INVALID_CREDENTIALS",
        "Kata laluan atau PIN yang dimasukkan tidak tepat dengan pendaftaran akaun anda. Sila cuba lagi."
      ),
      401
    );
  }

  // Enforce subscription plan expiry check
  const now = new Date();
  const isExpired = tenant.planExpiresAt && now.getTime() > new Date(tenant.planExpiresAt).getTime();
  if (isExpired) {
    if (tenant.status === "active") {
      try {
        await db
          .update(tenantAccounts)
          .set({ status: "plan_expired", updatedAt: new Date() })
          .where(eq(tenantAccounts.id, tenant.id));
      } catch (statusErr) {
        console.warn("Failed to mark tenant status as plan_expired:", statusErr);
      }
    }

    const expiryFormatted = tenant.planExpiresAt
      ? new Date(tenant.planExpiresAt).toLocaleDateString("ms-MY", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "baru-baru ini";

    return c.json(
      error(
        "PLAN_EXPIRED",
        `Tempoh pelan langganan Sub-Admin anda telah tamat pada ${expiryFormatted}. Galeri anda disimpan selama 3 hari. Sila hubungi Super Admin untuk menyambung akses portal.`
      ),
      403
    );
  }

  const weddingId = tenant.weddingId;
  let weddingSlug = tenant.weddingSlug;
  let weddingName = tenant.weddingName;

  // Always sync with live wedding-service to guarantee matching slug and name
  const liveWedding = await syncWithWeddingService(weddingId, weddingSlug, weddingName);
  if (liveWedding.slug !== weddingSlug || liveWedding.name !== weddingName) {
    weddingSlug = liveWedding.slug;
    weddingName = liveWedding.name;
    try {
      await db
        .update(tenantAccounts)
        .set({
          weddingSlug,
          weddingName,
          updatedAt: new Date(),
        })
        .where(eq(tenantAccounts.id, tenant.id));
    } catch (err) {
      console.warn("Failed to persist synced wedding slug to PostgreSQL:", err);
    }
  }

  const token = await createTenantToken({
    tenantId: tenant.id,
    username: tenant.username,
    email: tenant.email,
    weddingId,
    weddingSlug,
    weddingName,
  });

  return c.json(
    success({
      token,
      tenant: {
        id: tenant.id,
        username: tenant.username,
        email: tenant.email,
        weddingId,
        weddingSlug,
        weddingName,
        planTier: tenant.planTier,
        planExpiresAt: tenant.planExpiresAt,
        mediaExpiresAt: tenant.mediaExpiresAt,
        preserveMedia: tenant.preserveMedia,
        status: tenant.status,
      },
    })
  );
});

authRoute.get("/me", requireTenantAuth, async (c) => {
  const tokenTenant = c.get("tenant") as TenantPayload;

  // Fetch fresh tenant from PostgreSQL via Drizzle
  let tenant = null;
  try {
    const list = await db
      .select()
      .from(tenantAccounts)
      .where(eq(tenantAccounts.id, tokenTenant.tenantId))
      .limit(1);
    tenant = list[0];
  } catch (err) {
    console.warn("Database lookup failed in /me:", err);
  }

  const weddingId = tenant?.weddingId || tokenTenant.weddingId;
  const currentSlug = tenant?.weddingSlug || tokenTenant.weddingSlug;
  const currentName = tenant?.weddingName || tokenTenant.weddingName;

  // Fetch live wedding details from wedding-service
  const liveWedding = await syncWithWeddingService(
    weddingId,
    currentSlug,
    currentName
  );

  return c.json(
    success({
      tenant: {
        id: tenant?.id || tokenTenant.tenantId,
        username: tenant?.username || tokenTenant.username,
        email: tenant?.email || tokenTenant.email,
        weddingId,
        weddingSlug: liveWedding.slug,
        weddingName: liveWedding.name,
        role: tokenTenant.role,
        planTier: tenant?.planTier || "1day",
        planExpiresAt: tenant?.planExpiresAt || null,
        mediaExpiresAt: tenant?.mediaExpiresAt || null,
        preserveMedia: tenant?.preserveMedia ?? false,
        status: tenant?.status || "active",
        mediaCleanedUp: tenant?.mediaCleanedUp ?? false,
      },
    })
  );
});

authRoute.post("/logout", async (c) => {
  return c.json(success({ message: "Successfully logged out" }));
});

export default authRoute;
