import { eq, desc } from "drizzle-orm";
import { db, client } from "../db";
import { vouchers, customerInquiries } from "../db/schema";

export type VoucherDiscountType = "fixed" | "percentage";

export interface AdminVoucher {
  id: string;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  status: "active" | "exhausted" | "expired" | "disabled";
}

export interface VoucherValidationResult {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: VoucherDiscountType;
  discountValue?: number;
  discountAmount?: string;
  originalPrice?: string;
  finalPrice?: string;
  discountFormatted?: string;
}

export function parsePriceNumber(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function computeVoucherStatus(row: typeof vouchers.$inferSelect): "active" | "exhausted" | "expired" | "disabled" {
  if (!row.isActive) return "disabled";

  if (row.expiresAt) {
    const expDate = new Date(row.expiresAt);
    if (!isNaN(expDate.getTime()) && Date.now() > expDate.getTime()) {
      return "expired";
    }
  }

  const used = Number(row.usedCount) || 0;
  if (row.usageLimit !== null && row.usageLimit !== undefined) {
    const limit = Number(row.usageLimit);
    if (!isNaN(limit) && limit > 0 && used >= limit) {
      return "exhausted";
    }
  }

  return "active";
}

function mapVoucherRow(row: typeof vouchers.$inferSelect): AdminVoucher {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType as VoucherDiscountType,
    discountValue: parseFloat(row.discountValue) || 0,
    usageLimit: row.usageLimit !== null && row.usageLimit !== undefined ? Number(row.usageLimit) : null,
    usedCount: Number(row.usedCount) || 0,
    expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    isActive: row.isActive,
    description: row.description || null,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).getTime() : Date.now(),
    status: computeVoucherStatus(row),
  };
}

/**
 * List all vouchers with calculated status and usage metrics.
 */
export async function listVouchers(): Promise<AdminVoucher[]> {
  const rows = await db
    .select()
    .from(vouchers)
    .orderBy(desc(vouchers.createdAt));

  return rows.map(mapVoucherRow);
}

/**
 * Create a new voucher code.
 */
export async function createVoucher(params: {
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  description?: string | null;
}): Promise<AdminVoucher> {
  const cleanCode = params.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!cleanCode || cleanCode.length < 2 || cleanCode.length > 30) {
    const err = new Error("Voucher code must be between 2 and 30 characters.");
    (err as any).code = "INVALID_CODE";
    throw err;
  }

  if (params.discountValue <= 0) {
    const err = new Error("Discount value must be greater than 0.");
    (err as any).code = "INVALID_VALUE";
    throw err;
  }

  if (params.discountType === "percentage" && params.discountValue > 100) {
    const err = new Error("Percentage discount cannot exceed 100%.");
    (err as any).code = "INVALID_VALUE";
    throw err;
  }

  // Check if voucher with same code already exists (case-insensitive)
  const existing = await client`
    SELECT id FROM vouchers WHERE UPPER(code) = UPPER(${cleanCode}) LIMIT 1
  `;

  if (existing.length > 0) {
    const err = new Error(`Voucher code "${cleanCode}" already exists.`);
    (err as any).code = "CODE_EXISTS";
    throw err;
  }

  let expiresAtDate: Date | null = null;
  if (params.expiresAt) {
    const d = new Date(params.expiresAt);
    if (!isNaN(d.getTime())) {
      expiresAtDate = d;
    }
  }

  const [created] = await db
    .insert(vouchers)
    .values({
      code: cleanCode,
      discountType: params.discountType,
      discountValue: params.discountValue.toString(),
      usageLimit: params.usageLimit !== null && params.usageLimit !== undefined ? params.usageLimit : null,
      usedCount: 0,
      expiresAt: expiresAtDate,
      isActive: true,
      description: params.description?.trim() || null,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert voucher into database");
  }

  return mapVoucherRow(created);
}

/**
 * Validates a voucher against an inquiry price, phone, and username.
 */
export async function validateVoucher(params: {
  code: string;
  price: string;
  phone?: string;
  username?: string;
}): Promise<VoucherValidationResult> {
  const cleanCode = params.code.trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, message: "Please enter a voucher code." };
  }

  const matchingRows = await client`
    SELECT * FROM vouchers WHERE UPPER(code) = UPPER(${cleanCode}) LIMIT 1
  `;

  if (matchingRows.length === 0) {
    return { valid: false, message: `Voucher code "${cleanCode}" is invalid.` };
  }

  const row = matchingRows[0] as typeof vouchers.$inferSelect;

  if (!row.isActive) {
    return { valid: false, message: `Voucher "${cleanCode}" is currently inactive.` };
  }

  if (row.expiresAt) {
    const expDate = new Date(row.expiresAt);
    if (!isNaN(expDate.getTime()) && Date.now() > expDate.getTime()) {
      return { valid: false, message: `Voucher "${cleanCode}" has expired.` };
    }
  }

  const used = Number(row.usedCount) || 0;
  if (row.usageLimit !== null && row.usageLimit !== undefined) {
    const limit = Number(row.usageLimit);
    if (!isNaN(limit) && limit > 0 && used >= limit) {
      return {
        valid: false,
        message: `Voucher "${cleanCode}" has reached its maximum usage limit of ${limit} user(s).`,
      };
    }
  }

  // Check if this phone number or username already redeemed this voucher
  if (params.phone || params.username) {
    const rawPhone = params.phone ? params.phone.trim() : "";
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const cleanUser = params.username ? params.username.trim().toLowerCase() : "";

    const userRedeemed = await client`
      SELECT id FROM customer_inquiries 
      WHERE UPPER(voucher_code) = UPPER(${cleanCode})
        AND (
          (${cleanUser !== ""} AND LOWER(username) = LOWER(${cleanUser}))
          OR (${cleanDigits !== ""} AND translate(phone, ' -()+.', '') = ${cleanDigits})
        )
      LIMIT 1
    `;

    if (userRedeemed.length > 0) {
      return {
        valid: false,
        message: `You have already redeemed voucher "${cleanCode}". Limit is 1 per customer.`,
      };
    }
  }

  const originalPriceNum = parsePriceNumber(params.price);
  const discountVal = parseFloat(row.discountValue) || 0;
  const isPercentage = row.discountType === "percentage";

  let discountNum = 0;
  if (isPercentage) {
    discountNum = (originalPriceNum * discountVal) / 100;
  } else {
    discountNum = discountVal;
  }

  // Cap discount at original price
  if (discountNum > originalPriceNum) {
    discountNum = originalPriceNum;
  }

  const finalNum = Math.max(0, originalPriceNum - discountNum);

  const formatMoney = (val: number) => {
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  };

  const discountFormatted = isPercentage
    ? `-${discountVal}% (-RM ${formatMoney(discountNum)})`
    : `-RM ${formatMoney(discountNum)}`;

  return {
    valid: true,
    message: isPercentage
      ? `Voucher "${cleanCode}" applied! ${discountVal}% discount.`
      : `Voucher "${cleanCode}" applied! RM ${formatMoney(discountNum)} discount.`,
    code: cleanCode,
    discountType: row.discountType as VoucherDiscountType,
    discountValue: discountVal,
    discountAmount: `RM ${formatMoney(discountNum)}`,
    originalPrice: `RM ${formatMoney(originalPriceNum)}`,
    finalPrice: `RM ${formatMoney(finalNum)}`,
    discountFormatted,
  };
}

/**
 * Increment voucher usage count atomically with conditional limit guard.
 * Returns true if increment succeeded, false if limit was reached or voucher expired.
 */
export async function incrementVoucherUsage(code: string): Promise<boolean> {
  const cleanCode = code.trim().toUpperCase();
  const res = await client`
    UPDATE vouchers
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE UPPER(code) = UPPER(${cleanCode})
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    RETURNING id
  `;
  return res.length > 0;
}

/**
 * Toggle voucher active status.
 */
export async function toggleVoucherStatus(id: string, isActive: boolean): Promise<AdminVoucher | null> {
  const [updated] = await db
    .update(vouchers)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(vouchers.id, id))
    .returning();

  return updated ? mapVoucherRow(updated) : null;
}

/**
 * Delete a voucher.
 */
export async function deleteVoucher(id: string): Promise<boolean> {
  const deleted = await db
    .delete(vouchers)
    .where(eq(vouchers.id, id))
    .returning({ id: vouchers.id });

  return deleted.length > 0;
}

/**
 * Retrieve inquiries that redeemed a given voucher code.
 */
export async function getVoucherRedemptions(codeOrId: string) {
  // First check if it's an ID
  const voucherRes = await client`
    SELECT code FROM vouchers WHERE id::text = ${codeOrId} OR UPPER(code) = UPPER(${codeOrId}) LIMIT 1
  `;

  if (voucherRes.length === 0 || !voucherRes[0]?.code) return [];
  const code = voucherRes[0].code;

  const rows = await client`
    SELECT id, username, phone, plan_name, price, final_price, discount_amount, created_at, status
    FROM customer_inquiries
    WHERE UPPER(voucher_code) = UPPER(${code})
    ORDER BY created_at DESC
  `;

  return rows.map((r: any) => ({
    id: r.id,
    username: r.username,
    phone: r.phone,
    planName: r.plan_name,
    originalPrice: r.price,
    finalPrice: r.final_price || r.price,
    discountAmount: r.discount_amount || "",
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }));
}
