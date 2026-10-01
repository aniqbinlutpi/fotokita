import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { customerInquiries } from "../db/schema";

export interface CustomerInquiry {
  id: string;
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  status: "pending" | "contacted" | "converted";
  createdAt: number;
  notes?: string;
}

function mapInquiryRow(row: typeof customerInquiries.$inferSelect): CustomerInquiry {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    planId: row.planId,
    planName: row.planName,
    price: row.price,
    status: row.status as "pending" | "contacted" | "converted",
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    notes: row.notes || undefined,
  };
}

export async function createInquiry(params: {
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  notes?: string;
}): Promise<CustomerInquiry> {
  const [created] = await db
    .insert(customerInquiries)
    .values({
      username: params.username.trim().toLowerCase(),
      phone: params.phone.trim(),
      planId: params.planId.trim(),
      planName: params.planName.trim(),
      price: params.price.trim(),
      status: "pending",
      notes: params.notes?.trim() || null,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert customer inquiry into database");
  }

  return mapInquiryRow(created);
}

export async function listInquiries(): Promise<CustomerInquiry[]> {
  const rows = await db
    .select()
    .from(customerInquiries)
    .orderBy(desc(customerInquiries.createdAt));

  return rows.map(mapInquiryRow);
}

export async function updateInquiryStatus(
  id: string,
  status: "pending" | "contacted" | "converted",
  notes?: string
): Promise<CustomerInquiry | null> {
  const updateValues: Partial<typeof customerInquiries.$inferInsert> = {
    status,
  };

  if (notes !== undefined) {
    updateValues.notes = notes;
  }

  const [updated] = await db
    .update(customerInquiries)
    .set(updateValues)
    .where(eq(customerInquiries.id, id))
    .returning();

  return updated ? mapInquiryRow(updated) : null;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const deleted = await db
    .delete(customerInquiries)
    .where(eq(customerInquiries.id, id))
    .returning({ id: customerInquiries.id });

  return deleted.length > 0;
}
