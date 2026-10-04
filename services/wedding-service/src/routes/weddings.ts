import { Hono } from "hono";
import {
  createWedding,
  deleteWedding,
  getWeddingById,
  getWeddingBySlug,
  getWeddings,
  isSlugAvailable,
  updateWedding,
} from "../services/wedding.service";
import {
  createWeddingSchema,
  slugSchema,
  updateWeddingSchema,
} from "../validators/wedding.validator";
import { success, error } from "../lib/response";

const app = new Hono({ strict: false });

app.get("/", async (c) => {
  const result = await getWeddings();

  return c.json(success(result));
});

// Check slug availability for real-time frontend validation
app.get("/check-slug", async (c) => {
  const slug = c.req.query("slug");
  if (!slug) {
    return c.json(
      error("VALIDATION_ERROR", "Query parameter 'slug' is required"),
      400,
    );
  }

  const parseResult = slugSchema.safeParse(slug);
  if (!parseResult.success) {
    const message =
      parseResult.error.issues[0]?.message || "Invalid URL slug format";
    return c.json(
      success({
        slug,
        available: false,
        message,
      }),
    );
  }

  const excludeId = c.req.query("excludeId");
  try {
    const available = await isSlugAvailable(slug, excludeId);

    return c.json(
      success({
        slug,
        available,
        message: available
          ? "This URL is available and ready to use!"
          : "This URL has already been taken. Please choose another.",
      }),
    );
  } catch (dbErr: any) {
    console.error("Database error in check-slug:", dbErr);
    return c.json(
      error(
        "DATABASE_ERROR",
        dbErr?.message || "Failed to verify slug availability in database",
      ),
      500,
    );
  }
});

// Lookup wedding by slug (e.g. fotokita.my/ali-dan-siti)
app.get("/slug/:slug", async (c) => {
  const slug = c.req.param("slug");
  const wedding = await getWeddingBySlug(slug);

  if (!wedding) {
    return c.json(
      error("WEDDING_NOT_FOUND", "Wedding not found"),
      404,
    );
  }

  return c.json(success(wedding));
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const wedding = await getWeddingById(id);

  if (!wedding) {
    return c.json(
      error(
        "WEDDING_NOT_FOUND",
        "Wedding not found",
      ),
      404,
    );
  }

  return c.json(success(wedding));
});


app.post("/", async (c) => {
  const body = await c.req.json();

  const result = createWeddingSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      error(
        "VALIDATION_ERROR",
        "Validation failed",
        result.error.flatten(),
      ),
      400,
    );
  }

  // 1. Service check: ensure slug is available
  const available = await isSlugAvailable(result.data.slug);
  if (!available) {
    return c.json(
      error(
        "SLUG_ALREADY_EXISTS",
        "This URL slug has already been registered. Please choose another.",
      ),
      409,
    );
  }

  try {
    const wedding = await createWedding(result.data);
    return c.json(success(wedding), 201);
  } catch (err: any) {
    // 2. Database constraint check: catch Postgres code 23505 (unique_violation)
    if (err?.code === "23505") {
      return c.json(
        error(
          "SLUG_ALREADY_EXISTS",
          "This URL slug has already been registered. Please choose another.",
        ),
        409,
      );
    }
    throw err;
  }
});

app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const result = updateWeddingSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      error(
        "VALIDATION_ERROR",
        "Validation failed",
        result.error.flatten(),
      ),
      400,
    );
  }

  if (result.data.slug) {
    const available = await isSlugAvailable(result.data.slug, id);
    if (!available) {
      return c.json(
        error(
          "SLUG_ALREADY_EXISTS",
          "This URL slug has already been registered by another wedding.",
        ),
        409,
      );
    }
  }

  const wedding = await updateWedding(id, result.data);

  if (!wedding) {
    return c.json(
      error(
        "WEDDING_NOT_FOUND",
        "Wedding not found",
      ),
      404,
    );
  }

  return c.json(success(wedding));
});


app.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const wedding = await deleteWedding(id);

  if (!wedding) {
    return c.json(
      {
        error: "Wedding not found",
      },
      404,
    );
  }

  return c.json({
    message: "Wedding deleted successfully",
  });
});

export default app;
