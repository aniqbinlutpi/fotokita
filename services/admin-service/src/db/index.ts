import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://fotokita:fotokita@localhost:5433/fotokita";

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Helper to ensure database tables exist
export async function initDb(): Promise<void> {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS customer_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL,
        phone TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        price TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS tenant_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token TEXT NOT NULL UNIQUE,
        tier TEXT NOT NULL,
        client_name TEXT,
        notes TEXT,
        receipt_data TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        used_at TIMESTAMP,
        registration_details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Ensure columns exist if table was already created
    await client`
      ALTER TABLE tenant_invites 
      ADD COLUMN IF NOT EXISTS receipt_data TEXT,
      ADD COLUMN IF NOT EXISTS receipt_filename TEXT,
      ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT;
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON tenant_invites (token);
    `;

    await client`
      CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries (created_at DESC);
    `;

    // Deduplicate any existing duplicate username records before applying unique constraint (keep most recent)
    await client`
      DELETE FROM customer_inquiries
      WHERE id NOT IN (
        SELECT DISTINCT ON (LOWER(username)) id
        FROM customer_inquiries
        ORDER BY LOWER(username), created_at DESC
      );
    `;

    // Deduplicate any existing duplicate phone records before applying unique constraint (keep most recent)
    await client`
      DELETE FROM customer_inquiries
      WHERE id NOT IN (
        SELECT DISTINCT ON (translate(phone, ' -()+.', '')) id
        FROM customer_inquiries
        ORDER BY translate(phone, ' -()+.', ''), created_at DESC
      );
    `;

    // Ensure unique index on lowercase username
    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_inquiries_username_lower
      ON customer_inquiries (LOWER(username));
    `;

    // Ensure unique index on phone
    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_inquiries_phone
      ON customer_inquiries (phone);
    `;

    // Ensure unique index on normalized phone digits
    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_inquiries_phone_digits
      ON customer_inquiries (translate(phone, ' -()+.', ''));
    `;

    console.log("✅ Admin database tables initialized successfully in PostgreSQL");
  } catch (err) {
    console.error("⚠️ Failed to initialize admin database tables:", err);
  }
}
