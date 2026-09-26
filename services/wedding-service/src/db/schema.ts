import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const weddings = pgTable("weddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
