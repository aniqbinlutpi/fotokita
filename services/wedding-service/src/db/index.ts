import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://fotokita:fotokita@localhost:5433/fotokita";

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Helper to ensure database tables and indexes exist on startup
export async function initDb(): Promise<void> {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS weddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_weddings_slug_lower
      ON weddings (LOWER(slug));
    `;

    console.log("✅ Wedding database tables initialized successfully in PostgreSQL");
  } catch (err) {
    console.error("⚠️ Failed to initialize wedding database tables:", err);
  }
}

