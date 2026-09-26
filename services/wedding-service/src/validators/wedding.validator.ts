import { z } from "zod";

export const createWeddingSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  date: z.coerce.date(),
});

export const updateWeddingSchema = createWeddingSchema.partial();
