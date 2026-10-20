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
      ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT,
      ADD COLUMN IF NOT EXISTS client_phone TEXT,
      ADD COLUMN IF NOT EXISTS wedding_date TEXT,
      ADD COLUMN IF NOT EXISTS plan_start_date TEXT;
    `;

    await client`
      ALTER TABLE customer_inquiries
      ADD COLUMN IF NOT EXISTS wedding_date TEXT,
      ADD COLUMN IF NOT EXISTS plan_start_date TEXT,
      ADD COLUMN IF NOT EXISTS voucher_code TEXT,
      ADD COLUMN IF NOT EXISTS discount_amount TEXT,
      ADD COLUMN IF NOT EXISTS original_price TEXT,
      ADD COLUMN IF NOT EXISTS final_price TEXT,
      ADD COLUMN IF NOT EXISTS voucher_applied BOOLEAN DEFAULT false;
    `;

    await client`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        discount_value TEXT NOT NULL,
        usage_limit INTEGER,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Ensure integer types if table was created previously with TEXT
    await client`
      DO $$ BEGIN
        ALTER TABLE vouchers ALTER COLUMN used_count TYPE integer USING used_count::integer;
        ALTER TABLE vouchers ALTER COLUMN usage_limit TYPE integer USING usage_limit::integer;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `;

    // Race-condition guard: check constraint to prevent negative used_count
    await client`
      DO $$ BEGIN
        ALTER TABLE vouchers ADD CONSTRAINT chk_vouchers_used_count CHECK (used_count >= 0);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `;

    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_vouchers_code_upper
      ON vouchers (UPPER(code));
    `;

    // Race-condition guard: prevent duplicate voucher redemptions by the same username or phone
    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_inquiries_username_voucher
      ON customer_inquiries (LOWER(username), UPPER(voucher_code))
      WHERE voucher_code IS NOT NULL;
    `;

    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_inquiries_phone_voucher
      ON customer_inquiries (translate(phone, ' -()+.', ''), UPPER(voucher_code))
      WHERE voucher_code IS NOT NULL;
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
