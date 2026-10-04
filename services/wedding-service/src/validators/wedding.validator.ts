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
  "demo",
  "portal",
  "subadmin",
  "gallery",
  "adminfotokita",
  "w",
];

export const slugSchema = z
  .string()
  .min(3, "URL slug must be at least 3 characters")
  .max(60, "URL slug cannot exceed 60 characters")
  .regex(
    /^[a-z0-9]+(?:[-&][a-z0-9]+)*$/,
    "URL slug can only contain lowercase letters, numbers, hyphens (-), and ampersands (&)",
  )
  .refine((val) => !RESERVED_SLUGS.includes(val.toLowerCase()), {
    message: "This URL slug is a reserved system keyword and cannot be used",
  });

export const createWeddingSchema = z.object({
  name: z.string().min(1, "Couple names are required").max(100),
  slug: slugSchema,
  date: z.coerce.date(),
});

export const updateWeddingSchema = createWeddingSchema.partial();

