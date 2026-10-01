import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const tenantAccounts = pgTable("tenant_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  weddingId: text("wedding_id").notNull(),
  weddingSlug: text("wedding_slug").notNull(),
  weddingName: text("wedding_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantCustomizations = pgTable("tenant_customizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  weddingId: text("wedding_id").notNull().unique(),
  partner1: text("partner1"),
  partner2: text("partner2"),
  weddingDate: text("wedding_date"),
  eyebrow: text("eyebrow").notNull().default("- WEDDING ARCHIVE -"),
  tagline: text("tagline").notNull().default("Every candid smile, every heartfelt celebration — preserved for a lifetime."),
  themePalette: text("theme_palette").notNull().default("warmGold"),
  fireworksEnabled: boolean("fireworks_enabled").notNull().default(true),
  orbStyle: text("orb_style").notNull().default("warmGoldChocolate"),
  fontPreset: text("font_preset").notNull().default("editorial-serif"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TenantAccount = typeof tenantAccounts.$inferSelect;
export type TenantCustomization = typeof tenantCustomizations.$inferSelect;
