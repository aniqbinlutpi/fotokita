import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
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
  username: text("username").notNull().unique(),
  phone: text("phone").notNull().unique(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  price: text("price").notNull(),
  weddingDate: text("wedding_date"),
  planStartDate: text("plan_start_date"),
  status: text("status").notNull().default("pending"), // pending | contacted | converted
  notes: text("notes"),
  voucherCode: text("voucher_code"),
  discountAmount: text("discount_amount"),
  originalPrice: text("original_price"),
  finalPrice: text("final_price"),
  voucherApplied: boolean("voucher_applied").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'fixed' (RM) | 'percentage' (%)
  discountValue: text("discount_value").notNull(), // Numeric value stored as string (e.g. "5.00" or "10")
  usageLimit: integer("usage_limit"), // Nullable integer (e.g. 10, null for unlimited)
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantInvites = pgTable("tenant_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  tier: text("tier").notNull(),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  weddingDate: text("wedding_date"),
  planStartDate: text("plan_start_date"),
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

