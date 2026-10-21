import { eq, desc } from "drizzle-orm";
import { db, client } from "../db";
import { customerInquiries } from "../db/schema";
import { validateVoucher, incrementVoucherUsage, parsePriceNumber } from "./vouchers";

export type InquiryStatus = "pending" | "contacted" | "sent" | "registered" | "converted";

export interface CustomerInquiry {
  id: string;
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  weddingDate?: string;
  planStartDate?: string;
  status: InquiryStatus;
  createdAt: number;
  notes?: string;
  voucherCode?: string;
  discountAmount?: string;
  originalPrice?: string;
  finalPrice?: string;
  voucherApplied?: boolean;
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
    status: row.status as InquiryStatus,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    notes: row.notes || undefined,
    voucherCode: row.voucherCode || undefined,
    discountAmount: row.discountAmount || undefined,
    originalPrice: row.originalPrice || undefined,
    finalPrice: row.finalPrice || undefined,
    voucherApplied: Boolean(row.voucherApplied),
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
  voucherCode?: string;
}): Promise<CustomerInquiry> {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanPhone = params.phone.trim();
  const cleanDigits = cleanPhone.replace(/\D/g, "");

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
    // Database Transaction & Row-Level Locking to eliminate race conditions
    return await client.begin(async (sql) => {
      let validatedVoucherCode: string | null = null;
      let discountAmountStr: string | null = null;
      let originalPriceStr = params.price.trim();
      let finalPriceStr = params.price.trim();
      let voucherApplied = false;

      if (params.voucherCode && params.voucherCode.trim()) {
        const codeToUse = params.voucherCode.trim().toUpperCase();

        // 1. Pessimistic Row Lock (SELECT ... FOR UPDATE):
        // Concurrently incoming redemptions for this voucher row are serialized by PostgreSQL.
        const voucherRows = await sql`
          SELECT id, code, discount_type, discount_value, usage_limit, used_count, expires_at, is_active
          FROM vouchers
          WHERE UPPER(code) = UPPER(${codeToUse})
          FOR UPDATE
        `;

        if (!voucherRows.length || !voucherRows[0]) {
          const err = new Error(`Voucher code "${codeToUse}" does not exist.`);
          (err as any).code = "INVALID_VOUCHER";
          throw err;
        }

        const vRow = voucherRows[0];

        if (!vRow.is_active) {
          const err = new Error(`Voucher "${codeToUse}" is currently inactive.`);
          (err as any).code = "INVALID_VOUCHER";
          throw err;
        }

        if (vRow.expires_at) {
          const expDate = new Date(vRow.expires_at);
          if (!isNaN(expDate.getTime()) && Date.now() > expDate.getTime()) {
            const err = new Error(`Voucher "${codeToUse}" has expired.`);
            (err as any).code = "INVALID_VOUCHER";
            throw err;
          }
        }

        const currentUsed = Number(vRow.used_count) || 0;
        const maxLimit = vRow.usage_limit !== null && vRow.usage_limit !== undefined ? Number(vRow.usage_limit) : null;

        if (maxLimit !== null && maxLimit > 0 && currentUsed >= maxLimit) {
          const err = new Error(`Voucher "${codeToUse}" has reached its maximum usage limit of ${maxLimit} user(s).`);
          (err as any).code = "INVALID_VOUCHER";
          throw err;
        }

        // 2. Race condition check: Verify user/phone hasn't redeemed this voucher under lock
        const priorClaims = await sql`
          SELECT id FROM customer_inquiries
          WHERE UPPER(voucher_code) = UPPER(${codeToUse})
            AND (
              LOWER(username) = LOWER(${cleanUsername})
              OR translate(phone, ' -()+.', '') = ${cleanDigits}
            )
          LIMIT 1
        `;

        if (priorClaims.length > 0) {
          const err = new Error(`You have already redeemed voucher "${codeToUse}". Limit is 1 per customer.`);
          (err as any).code = "INVALID_VOUCHER";
          throw err;
        }

        // 3. Calculate discount value
        const origPriceNum = parsePriceNumber(params.price);
        const discountVal = parseFloat(vRow.discount_value) || 0;
        let discountNum = 0;
        if (vRow.discount_type === "percentage") {
          discountNum = (origPriceNum * discountVal) / 100;
        } else {
          discountNum = discountVal;
        }
        if (discountNum > origPriceNum) discountNum = origPriceNum;
        const finalNum = Math.max(0, origPriceNum - discountNum);

        const formatMoney = (val: number) => (Number.isInteger(val) ? val.toString() : val.toFixed(2));

        validatedVoucherCode = vRow.code;
        discountAmountStr = `RM ${formatMoney(discountNum)}`;
        originalPriceStr = `RM ${formatMoney(origPriceNum)}`;
        finalPriceStr = `RM ${formatMoney(finalNum)}`;
        voucherApplied = true;

        // 4. Atomically increment used_count within the transaction
        await sql`
          UPDATE vouchers
          SET used_count = used_count + 1,
              updated_at = NOW()
          WHERE id = ${vRow.id}
        `;
      }

      // 5. Insert customer inquiry inside the transaction
      const insertRows = await sql`
        INSERT INTO customer_inquiries (
          username, phone, plan_id, plan_name, price,
          wedding_date, plan_start_date, status, notes,
          voucher_code, discount_amount, original_price, final_price, voucher_applied
        ) VALUES (
          ${cleanUsername}, ${cleanPhone}, ${params.planId.trim()}, ${params.planName.trim()}, ${params.price.trim()},
          ${params.weddingDate?.trim() || null}, ${params.planStartDate?.trim() || null}, 'pending', ${params.notes?.trim() || null},
          ${validatedVoucherCode}, ${discountAmountStr}, ${originalPriceStr}, ${finalPriceStr}, ${voucherApplied}
        )
        RETURNING *
      `;

      if (!insertRows.length || !insertRows[0]) {
        throw new Error("Failed to insert customer inquiry into database");
      }

      const created = insertRows[0];
      return {
        id: created.id,
        username: created.username,
        phone: created.phone,
        planId: created.plan_id,
        planName: created.plan_name,
        price: created.price,
        weddingDate: created.wedding_date || undefined,
        planStartDate: created.plan_start_date || undefined,
        status: created.status as "pending" | "contacted" | "converted",
        createdAt: created.created_at ? new Date(created.created_at).getTime() : Date.now(),
        notes: created.notes || undefined,
        voucherCode: created.voucher_code || undefined,
        discountAmount: created.discount_amount || undefined,
        originalPrice: created.original_price || undefined,
        finalPrice: created.final_price || undefined,
        voucherApplied: Boolean(created.voucher_applied),
      };
    });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.toLowerCase().includes("unique")) {
      const errMsg = err?.detail || err?.message || "";
      if (errMsg.toLowerCase().includes("voucher")) {
        const errorObj = new Error("This voucher code has already been redeemed by this account or phone number.");
        (errorObj as any).code = "INVALID_VOUCHER";
        throw errorObj;
      }
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
  try {
    // 1. Auto-sync: Mark inquiries as 'registered' if a matching tenant_invite is used
    await client`
      UPDATE customer_inquiries ci
      SET status = 'registered'
      FROM tenant_invites ti
      WHERE ci.status != 'registered'
        AND ti.is_used = true
        AND (
          (ti.client_name IS NOT NULL AND LOWER(ci.username) = LOWER(ti.client_name))
          OR (ti.registration_details IS NOT NULL AND LOWER(ci.username) = LOWER(ti.registration_details->>'username'))
          OR (ti.client_phone IS NOT NULL AND translate(ti.client_phone, ' -()+.', '') = translate(ci.phone, ' -()+.', ''))
        )
    `;

    // 2. Auto-sync: Mark inquiries as 'sent' if an active tenant_invite exists and inquiry is still 'pending' or 'contacted'
    await client`
      UPDATE customer_inquiries ci
      SET status = 'sent'
      FROM tenant_invites ti
      WHERE ci.status IN ('pending', 'contacted')
        AND ti.is_used = false
        AND ti.expires_at > NOW()
        AND (
          (ti.client_name IS NOT NULL AND LOWER(ci.username) = LOWER(ti.client_name))
          OR (ti.client_phone IS NOT NULL AND translate(ti.client_phone, ' -()+.', '') = translate(ci.phone, ' -()+.', ''))
        )
    `;
  } catch (syncErr) {
    console.warn("Could not auto-sync inquiry statuses with tenant_invites:", syncErr);
  }

  const rows = await db
    .select()
    .from(customerInquiries)
    .orderBy(desc(customerInquiries.createdAt));

  return rows.map(mapInquiryRow);
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
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
