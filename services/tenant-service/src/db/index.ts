import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://fotokita:fotokita@localhost:5433/fotokita";

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export async function initDb(): Promise<void> {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS tenant_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        wedding_id TEXT NOT NULL,
        wedding_slug TEXT NOT NULL,
        wedding_name TEXT NOT NULL,
        plan_tier TEXT NOT NULL DEFAULT '1day',
        plan_expires_at TIMESTAMP,
        media_expires_at TIMESTAMP,
        preserve_media BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'active',
        media_cleaned_up BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Safely add any new columns to existing tables
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT '1day';`;
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;`;
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS media_expires_at TIMESTAMP;`;
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS preserve_media BOOLEAN NOT NULL DEFAULT false;`;
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`;
    await client`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS media_cleaned_up BOOLEAN NOT NULL DEFAULT false;`;

    // Index for cleanup query performance
    await client`CREATE INDEX IF NOT EXISTS idx_tenant_media_cleanup ON tenant_accounts (media_expires_at, media_cleaned_up, preserve_media);`;

    console.log("🐘 Tenant Service connected directly to PostgreSQL database via Drizzle ORM and verified schema.");
  } catch (err) {
    console.error("⚠️ Failed to initialize tenant database tables:", err);
  }
}
