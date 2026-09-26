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

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
