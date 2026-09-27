import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),

  weddingId: uuid("wedding_id").notNull(),

  storageKey: text("storage_key").notNull(),

  filename: text("filename").notNull(),

  mimeType: text("mime_type").notNull(),

  size: integer("size").notNull(),

  wishes: text("wishes"),

  fromName: text("from_name"),

  signature: text("signature"),

  secretCode: text("secret_code"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

