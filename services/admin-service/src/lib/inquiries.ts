import { eq, desc } from "drizzle-orm";
import { db, client } from "../db";
import { customerInquiries } from "../db/schema";

export interface CustomerInquiry {
  id: string;
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  weddingDate?: string;
  planStartDate?: string;
  status: "pending" | "contacted" | "converted";
  createdAt: number;
  notes?: string;
}

export interface InquiryAvailabilityResult {
  username?: {
    available: boolean;
    message: string;
  };
  phone?: {
    available: boolean;
    message: string;
  };
}

function mapInquiryRow(row: typeof customerInquiries.$inferSelect): CustomerInquiry {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    planId: row.planId,
    planName: row.planName,
    price: row.price,
    weddingDate: row.weddingDate || undefined,
    planStartDate: row.planStartDate || undefined,
    status: row.status as "pending" | "contacted" | "converted",
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    notes: row.notes || undefined,
  };
}

/**
 * Checks whether a proposed username and/or phone number is already registered or reserved.
 */
export async function checkInquiryAvailability(params: {
  username?: string;
  phone?: string;
}): Promise<InquiryAvailabilityResult> {
  const result: InquiryAvailabilityResult = {};

  if (params.username !== undefined) {
    const cleanUser = params.username.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      result.username = {
        available: false,
        message: "Username must be at least 3 characters.",
      };
    } else if (!/^[a-z0-9_.]+$/.test(cleanUser)) {
      result.username = {
        available: false,
        message: "Username can only contain lowercase letters, numbers, underscores (_), and dots (.).",
      };
    } else {
      // 1. Check existing customer inquiries
      const inqMatches = await client`
        SELECT id FROM customer_inquiries 
        WHERE LOWER(username) = LOWER(${cleanUser}) 
        LIMIT 1
      `;

      if (inqMatches.length > 0) {
        result.username = {
          available: false,
          message: "Username is already taken. Please choose another.",
        };
      } else {
        // 2. Check tenant invites
        const inviteMatches = await client`
          SELECT id FROM tenant_invites 
          WHERE LOWER(client_name) = LOWER(${cleanUser}) 
             OR LOWER(registration_details->>'username') = LOWER(${cleanUser}) 
          LIMIT 1
        `;

        if (inviteMatches.length > 0) {
          result.username = {
            available: false,
            message: "Username is already reserved. Please choose another.",
          };
        } else {
          // 3. Check registered tenant accounts
          let tenantTaken = false;
          try {
            const tenantMatches = await client`
              SELECT id FROM tenant_accounts 
              WHERE LOWER(username) = LOWER(${cleanUser}) 
              LIMIT 1
            `;
            if (tenantMatches.length > 0) {
              tenantTaken = true;
            }
          } catch {
            // Ignore if tenant_accounts table does not exist
          }

          if (tenantTaken) {
            result.username = {
              available: false,
              message: "Username is already taken by a registered tenant. Please choose another.",
            };
          } else {
            result.username = {
              available: true,
              message: "Username is available!",
            };
          }
        }
      }
    }
  }

  if (params.phone !== undefined) {
    const rawPhone = params.phone.trim();
    const cleanDigits = rawPhone.replace(/\D/g, "");

    if (!cleanDigits || cleanDigits.length < 8) {
      result.phone = {
        available: false,
        message: "Please enter a valid phone number (at least 8 digits).",
      };
    } else {
      const phoneMatches = await client`
        SELECT id FROM customer_inquiries 
        WHERE phone = ${rawPhone} 
           OR translate(phone, ' -()+.', '') = ${cleanDigits} 
        LIMIT 1
      `;

      if (phoneMatches.length > 0) {
        result.phone = {
          available: false,
          message: "This WhatsApp phone number has already submitted an inquiry.",
        };
      } else {
        result.phone = {
          available: true,
          message: "Phone number is available.",
        };
      }
    }
  }

  return result;
}

export async function createInquiry(params: {
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  weddingDate?: string;
  planStartDate?: string;
  notes?: string;
}): Promise<CustomerInquiry> {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanPhone = params.phone.trim();

  // Pre-validate username & phone uniqueness
  const availability = await checkInquiryAvailability({
    username: cleanUsername,
    phone: cleanPhone,
  });

  if (availability.username && !availability.username.available) {
    const err = new Error(availability.username.message);
    (err as any).code = "USERNAME_TAKEN";
    throw err;
  }

  if (availability.phone && !availability.phone.available) {
    const err = new Error(availability.phone.message);
    (err as any).code = "PHONE_TAKEN";
    throw err;
  }

  try {
    const [created] = await db
      .insert(customerInquiries)
      .values({
        username: cleanUsername,
        phone: cleanPhone,
        planId: params.planId.trim(),
        planName: params.planName.trim(),
        price: params.price.trim(),
        weddingDate: params.weddingDate?.trim() || null,
        planStartDate: params.planStartDate?.trim() || null,
        status: "pending",
        notes: params.notes?.trim() || null,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to insert customer inquiry into database");
    }

    return mapInquiryRow(created);
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.toLowerCase().includes("unique")) {
      const errMsg = err?.detail || err?.message || "";
      if (errMsg.toLowerCase().includes("username")) {
        const errorObj = new Error("This username is already taken. Please choose another username.");
        (errorObj as any).code = "USERNAME_TAKEN";
        throw errorObj;
      }
      if (errMsg.toLowerCase().includes("phone")) {
        const errorObj = new Error("This phone number has already submitted an inquiry.");
        (errorObj as any).code = "PHONE_TAKEN";
        throw errorObj;
      }
      const errorObj = new Error("An inquiry with these details already exists.");
      (errorObj as any).code = "DUPLICATE_ENTRY";
      throw errorObj;
    }
    throw err;
  }
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
