import { z } from "zod";

export const createMediaSchema = z.object({
  weddingId: z.uuid(),
});

export const mediaIdParamSchema = z.object({
  id: z.uuid(),
});

