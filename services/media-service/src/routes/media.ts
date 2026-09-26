import { Hono } from "hono";
//import { z } from "zod";

import {
  createMedia,
  getMediaByWeddingId,
  getMediaUrl,
} from "../services/media.service";


import { createMediaSchema } from "../validators/media.validator";


const mediaRoutes = new Hono();

mediaRoutes.get("/:id/url", async (c) => {
  const id = c.req.param("id");

  const result = await getMediaUrl(id);

  if (!result) {
    return c.json(
      {
        error: "Media not found",
      },
      404,
    );
  }

  return c.json({
    data: {
      id: result.id,
      url: result.url,
      filename: result.filename,
      mimeType: result.mimeType,
    },
  });
});

mediaRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();

  const weddingId = body.weddingId;
  const file = body.file;

  const validation = createMediaSchema.safeParse({
    weddingId,
  });

  if (!validation.success) {
    return c.json(
      {
        error: "Validation failed",
        details: validation.error.flatten(),
      },
      400,
    );
  }

  if (!(file instanceof File)) {
    return c.json(
      {
        error: "Validation failed",
        details: {
          fieldErrors: {
            file: ["File is required"],
          },
        },
      },
      400,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const createdMedia = await createMedia({
    weddingId: validation.data.weddingId,
    file: buffer,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });

  return c.json(
    {
      data: createdMedia,
    },
    201,
  );
});

export default mediaRoutes;
