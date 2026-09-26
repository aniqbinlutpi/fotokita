import { z } from "zod";

export const createMediaSchema = z.object({
  weddingId: z.uuid(),
});
