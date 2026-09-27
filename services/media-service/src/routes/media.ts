import { Hono } from "hono";
//import { z } from "zod";

import {
  createMedia,
  deleteMedia,
  getMediaById,
  getMediaByWeddingId,
  getMediaUrl,
} from "../services/media.service";

import {
  createMediaSchema,
  getMediaQuerySchema,
  mediaIdParamSchema,
  validateMediaUpload,
} from "../validators/media.validator";
import { error, success } from "../lib/response";


const mediaRoutes = new Hono();

mediaRoutes.get("/", async (c) => {
  const queryResult = getMediaQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json(
      error(
        "VALIDATION_ERROR",
        "Validation failed",
        queryResult.error.flatten(),
      ),
      400,
    );
  }

  const mediaList = await getMediaByWeddingId(queryResult.data.weddingId);

  return c.json(success(mediaList));
});


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

mediaRoutes.get("/:id", async (c) => {
  const paramResult = mediaIdParamSchema.safeParse(c.req.param());

  if (!paramResult.success) {
    return c.json(
      error(
        "VALIDATION_ERROR",
        "Validation failed",
        paramResult.error.flatten(),
      ),
      400,
    );
  }

  const mediaItem = await getMediaById(paramResult.data.id);

  if (!mediaItem) {
    return c.json(
      error(
        "MEDIA_NOT_FOUND",
        "Media not found",
      ),
      404,
    );
  }

  const { storageKey: _storageKey, ...safeMedia } = mediaItem;

  return c.json(success(safeMedia));
});


mediaRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();

  const validation = validateMediaUpload({
    weddingId: body.weddingId,
    file: body.file,
    wishes: body.wishes,
    fromName: body.from ?? body.fromName,
    signature: body.signature,
    secretCode: body.code ?? body.secretCode,
  });

  if (!validation.success) {
    return c.json(
      error(
        validation.error.code,
        validation.error.message,
        validation.error.details,
      ),
      400,
    );
  }

  const {
    weddingId,
    file,
    sanitizedFilename,
    wishes,
    fromName,
    signature,
    secretCode,
  } = validation.data;
  const buffer = Buffer.from(await file.arrayBuffer());

  const createdMedia = await createMedia({
    weddingId,
    file: buffer,
    filename: sanitizedFilename,
    mimeType: file.type,
    size: file.size,
    wishes,
    fromName,
    signature,
    secretCode,
  });

  return c.json(success(createdMedia), 201);
});

mediaRoutes.delete("/:id", async (c) => {
  const paramResult = mediaIdParamSchema.safeParse(c.req.param());

  if (!paramResult.success) {
    return c.json(
      error(
        "VALIDATION_ERROR",
        "Validation failed",
        paramResult.error.flatten(),
      ),
      400,
    );
  }

  const queryCode = c.req.query("code");
  const headerCode = c.req.header("x-secret-code");
  let bodyCode: string | undefined;
  try {
    const contentType = c.req.header("content-type");
    if (contentType?.includes("application/json")) {
      const body = await c.req.json();
      bodyCode = body?.code;
    }
  } catch {
    // optional body
  }

  const code = queryCode || headerCode || bodyCode;

  const result = await deleteMedia(paramResult.data.id, code);

  if (!result.success) {
    return c.json(
      error(result.code, result.message),
      result.status,
    );
  }

  return c.json(success(result.data));
});

export default mediaRoutes;
