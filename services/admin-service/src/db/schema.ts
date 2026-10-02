import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export interface TenantRegistrationDetails {
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  registeredAt: number;
}

export const customerInquiries = pgTable("customer_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  phone: text("phone").notNull(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("pending"), // pending | contacted | converted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenantInvites = pgTable("tenant_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  tier: text("tier").notNull(),
  clientName: text("client_name"),
  notes: text("notes"),
  receiptData: text("receipt_data"),
  receiptFilename: text("receipt_filename"),
  receiptMimeType: text("receipt_mime_type"),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  registrationDetails: jsonb("registration_details").$type<TenantRegistrationDetails>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

