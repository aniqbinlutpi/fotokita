import { db } from "../db";
import { weddings } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getWeddings() {
  return db.select().from(weddings);
}

export async function getWeddingById(id: string) {
  const result = await db
    .select()
    .from(weddings)
    .where(eq(weddings.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createWedding(data: {
  name: string;
  slug: string;
  date: Date;
}) {
  const result = await db
    .insert(weddings)
    .values(data)
    .returning();

  return result[0];
}

export async function updateWedding(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    date: Date;
  }>,
) {
  const result = await db
    .update(weddings)
    .set(data)
    .where(eq(weddings.id, id))
    .returning();

  return result[0] ?? null;
}

export async function deleteWedding(id: string) {
  const result = await db
    .delete(weddings)
    .where(eq(weddings.id, id))
    .returning();

  return result[0] ?? null;
}
