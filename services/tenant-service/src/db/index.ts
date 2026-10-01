import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://fotokita:fotokita@localhost:5433/fotokita";

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export async function initDb(): Promise<void> {
  await client`SELECT 1`;
  console.log("🐘 Tenant Service connected directly to PostgreSQL database via Drizzle ORM.");
}
