import { Hono } from "hono";
import {
  createWedding,
  deleteWedding,
  getWeddingById,
  getWeddings,
  updateWedding,
} from "../services/wedding.service";
import {
  createWeddingSchema,
  updateWeddingSchema,
} from "../validators/wedding.validator";
import { success, error } from "../lib/response";


const app = new Hono();

app.get("/", async (c) => {
  const result = await getWeddings();

  return c.json(success(result));
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
      {
        error: "Validation failed",
        details: result.error.flatten(),
      },
      400,
    );
  }

  const wedding = await createWedding(result.data);

  return c.json(wedding, 201);
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

  const wedding = await createWedding(result.data);

  return c.json(success(wedding), 201);
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
