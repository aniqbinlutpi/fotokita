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

    // Tenant Customization table and typography columns
    await client`
      CREATE TABLE IF NOT EXISTS tenant_customizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wedding_id TEXT NOT NULL UNIQUE,
        partner1 TEXT,
        partner2 TEXT,
        wedding_date TEXT,
        eyebrow TEXT NOT NULL DEFAULT '- WEDDING ARCHIVE -',
        tagline TEXT NOT NULL DEFAULT 'Every candid smile, every heartfelt celebration — preserved for a lifetime.',
        theme_palette TEXT NOT NULL DEFAULT 'warmGold',
        fireworks_enabled BOOLEAN NOT NULL DEFAULT true,
        orb_style TEXT NOT NULL DEFAULT 'warmGoldChocolate',
        font_preset TEXT NOT NULL DEFAULT 'editorial-serif',
        partner_font TEXT NOT NULL DEFAULT 'cormorant',
        partner_size TEXT NOT NULL DEFAULT 'normal',
        eyebrow_font TEXT NOT NULL DEFAULT 'inter',
        eyebrow_size TEXT NOT NULL DEFAULT 'normal',
        date_font TEXT NOT NULL DEFAULT 'inter',
        date_size TEXT NOT NULL DEFAULT 'normal',
        quote_font TEXT NOT NULL DEFAULT 'cormorant',
        quote_size TEXT NOT NULL DEFAULT 'normal',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS partner_font TEXT NOT NULL DEFAULT 'cormorant';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS partner_size TEXT NOT NULL DEFAULT 'normal';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS eyebrow_font TEXT NOT NULL DEFAULT 'inter';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS eyebrow_size TEXT NOT NULL DEFAULT 'normal';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS date_font TEXT NOT NULL DEFAULT 'inter';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS date_size TEXT NOT NULL DEFAULT 'normal';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS quote_font TEXT NOT NULL DEFAULT 'cormorant';`;
    await client`ALTER TABLE tenant_customizations ADD COLUMN IF NOT EXISTS quote_size TEXT NOT NULL DEFAULT 'normal';`;

    // Index for cleanup query performance
    await client`CREATE INDEX IF NOT EXISTS idx_tenant_media_cleanup ON tenant_accounts (media_expires_at, media_cleaned_up, preserve_media);`;

    console.log("🐘 Tenant Service connected directly to PostgreSQL database via Drizzle ORM and verified schema.");
  } catch (err) {
    console.error("⚠️ Failed to initialize tenant database tables:", err);
  }
}
