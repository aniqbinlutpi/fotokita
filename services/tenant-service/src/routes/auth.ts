import { Hono } from "hono";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { createTenantToken, verifyTenantToken, type TenantPayload } from "../lib/auth";
import { success, error } from "../lib/response";
import { db } from "../db";
import { tenantAccounts, tenantCustomizations } from "../db/schema";
import { calculatePlanDates } from "../utils/duration";
import { hashPassword, verifyPassword } from "../lib/password";

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
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(4, "Password or PIN must be at least 4 characters"),
  weddingId: z.string().min(1, "Wedding ID is required"),
  weddingSlug: z.string().min(1, "Wedding slug is required"),
  weddingName: z.string().min(1, "Wedding name is required"),
  planTier: z.string().optional().default("1day"),
  planStartDate: z.string().optional(),
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
      error("VALIDATION_ERROR", "Please complete all required registration fields", parsed.error.flatten()),
      400
    );
  }

  const { username, email, password, weddingId, weddingSlug, weddingName, planStartDate: rawStartDate } = parsed.data;
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUsername}@fotokita.com`).trim().toLowerCase();
  const cleanPassword = password.trim();
  const planTier = (parsed.data.planTier || "1day").trim().toLowerCase();
  const parsedStartDate = rawStartDate ? new Date(rawStartDate) : new Date();
  const validStartDate = isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;
  const { planStartDate, planExpiresAt, mediaExpiresAt } = calculatePlanDates(planTier, validStartDate);
  const now = new Date();
  const initialStatus = now.getTime() < planStartDate.getTime() ? "scheduled" : "active";

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
          "This username or email is already registered for another wedding. Please use a different username or email."
        ),
        409
      );
    }
  } catch (err: any) {
    console.error("Database check failed in /register:", err);
    return c.json(error("DATABASE_ERROR", "Failed to check account database"), 500);
  }

  // Insert or update tenant_accounts with registered credentials
  let registeredAccount;
  try {
    const rows = await db
      .insert(tenantAccounts)
      .values({
        username: cleanUsername,
        email: cleanEmail,
        password: await hashPassword(cleanPassword),
        weddingId,
        weddingSlug: weddingSlug.trim().toLowerCase(),
        weddingName: weddingName.trim(),
        planTier,
        planStartDate,
        planExpiresAt,
        mediaExpiresAt,
        preserveMedia: false,
        status: initialStatus,
        mediaCleanedUp: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tenantAccounts.username,
        set: {
          password: await hashPassword(cleanPassword),
          email: cleanEmail,
          weddingId,
          weddingSlug: weddingSlug.trim().toLowerCase(),
          weddingName: weddingName.trim(),
          planTier,
          planStartDate,
          planExpiresAt,
          mediaExpiresAt,
          status: initialStatus,
          updatedAt: new Date(),
        },
      })
      .returning();

    registeredAccount = rows[0];
  } catch (err: any) {
    console.error("Database insert failed in /register:", err);
    return c.json(error("DATABASE_ERROR", "Failed to save registration account to database"), 500);
  }

  if (!registeredAccount) {
    return c.json(error("DATABASE_ERROR", "Failed to process account registration"), 500);
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

    let initialWeddingDate = "";
    try {
      const weddingServiceUrl = process.env.WEDDING_SERVICE_URL || "http://localhost:3001";
      const res = await fetch(`${weddingServiceUrl}/weddings/${encodeURIComponent(weddingId)}`);
      if (res.ok) {
        const body = (await res.json()) as any;
        if (body?.data?.date) {
          initialWeddingDate = new Date(body.data.date).toISOString().split("T")[0] || "";
        }
      }
    } catch {
      // non-blocking
    }

    if (!initialWeddingDate && planStartDate) {
      initialWeddingDate = new Date(planStartDate).toISOString().split("T")[0] || "";
    }

    await db
      .insert(tenantCustomizations)
      .values({
        weddingId,
        partner1: p1,
        partner2: p2,
        weddingDate: initialWeddingDate || "",
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
        planStartDate: registeredAccount.planStartDate,
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
      error("VALIDATION_ERROR", "Please enter your username or email and password", parsed.error.flatten()),
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
    return c.json(error("DATABASE_ERROR", "Failed to check account database"), 500);
  }

  const tenant = tenantList[0];

  if (!tenant) {
    return c.json(
      error(
        "INVALID_CREDENTIALS",
        "No account found with the provided username or email. Please verify your registration."
      ),
      401
    );
  }

  // Strictly validate registered password / PIN from database
  const { isMatch, needsRehash } = await verifyPassword(tenant.password, inputPassword);

  if (!isMatch) {
    return c.json(
      error(
        "INVALID_CREDENTIALS",
        "The password or PIN entered does not match your registered account. Please try again."
      ),
      401
    );
  }

  // Upgrade legacy plaintext passwords to a hash on first successful login
  if (needsRehash) {
    try {
      await db
        .update(tenantAccounts)
        .set({ password: await hashPassword(inputPassword) })
        .where(eq(tenantAccounts.id, tenant.id));
    } catch (rehashErr) {
      console.warn("Failed to upgrade legacy password to hash:", rehashErr);
    }
  }

  const now = new Date();

  // Check if subscription plan has not started yet
  if (tenant.planStartDate && now.getTime() < new Date(tenant.planStartDate).getTime()) {
    const startFormatted = new Date(tenant.planStartDate).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return c.json(
      error(
        "PLAN_NOT_STARTED",
        `Your account and gallery are scheduled to start on ${startFormatted}. You can log in and access the portal at that time.`
      ),
      403
    );
  }

  // Auto-activate scheduled account once start time arrives
  if (tenant.status === "scheduled" && (!tenant.planStartDate || now.getTime() >= new Date(tenant.planStartDate).getTime())) {
    try {
      await db
        .update(tenantAccounts)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(tenantAccounts.id, tenant.id));
      tenant.status = "active";
    } catch (statusErr) {
      console.warn("Failed to activate scheduled tenant:", statusErr);
    }
  }

  // Enforce subscription plan expiry check
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
      ? new Date(tenant.planExpiresAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "recently";

    return c.json(
      error(
        "PLAN_EXPIRED",
        `Your Sub-Admin subscription plan expired on ${expiryFormatted}. Your gallery is preserved for 3 days. Please contact Admin to extend portal access.`
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
        planStartDate: tenant.planStartDate,
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
        planStartDate: tenant?.planStartDate || null,
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
