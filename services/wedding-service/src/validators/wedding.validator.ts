import { z } from "zod";

export const RESERVED_SLUGS = [
  "admin",
  "dashboard",
  "api",
  "media",
  "login",
  "register",
  "pricing",
  "settings",
  "health",
  "terms",
  "privacy",
  "subscribe",
  "billing",
];

export const slugSchema = z
  .string()
  .min(3, "URL slug mestilah sekurang-kurangnya 3 aksara")
  .max(60, "URL slug tidak boleh melebihi 60 aksara")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "URL slug hanya boleh mengandungi huruf kecil, nombor, dan tanda tolak (-)",
  )
  .refine((val) => !RESERVED_SLUGS.includes(val.toLowerCase()), {
    message: "URL ini adalah kata kunci khas sistem dan tidak boleh digunakan",
  });

export const createWeddingSchema = z.object({
  name: z.string().min(1, "Nama pasangan diperlukan").max(100),
  slug: slugSchema,
  date: z.coerce.date(),
});

export const updateWeddingSchema = createWeddingSchema.partial();

