import { Hono } from "hono";
import { z } from "zod";
import {
  listVouchers,
  createVoucher,
  validateVoucher,
  toggleVoucherStatus,
  deleteVoucher,
  getVoucherRedemptions,
} from "../lib/vouchers";
import { requireAdminAuth } from "./auth";
import { success, error } from "../lib/response";

const vouchersRoute = new Hono();

const validateVoucherSchema = z.object({
  code: z.string().min(1, "Voucher code is required"),
  price: z.string().min(1, "Price is required"),
  phone: z.string().optional(),
  username: z.string().optional(),
});

// PUBLIC ENDPOINT: Validate voucher & calculate auto-deducted price for inquiry modal
vouchersRoute.post("/validate", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validateVoucherSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Invalid validation parameters", parsed.error.flatten()),
      400
    );
  }

  try {
    const result = await validateVoucher(parsed.data);
    if (!result.valid) {
      return c.json(error("INVALID_VOUCHER", result.message), 400);
    }
    return c.json(success(result));
  } catch (err: any) {
    return c.json(
      error("INTERNAL_ERROR", err?.message || "Failed to validate voucher"),
      500
    );
  }
});

const createVoucherSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30, "Code cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  discountType: z.enum(["fixed", "percentage"] as const),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  description: z.string().max(255).optional(),
});

// ADMIN PROTECTED ROUTES:
vouchersRoute.get("/", requireAdminAuth, async (c) => {
  try {
    const vouchersList = await listVouchers();
    return c.json(success(vouchersList));
  } catch (err: any) {
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to list vouchers"), 500);
  }
});

vouchersRoute.post("/", requireAdminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createVoucherSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Please fill in all voucher details correctly", parsed.error.flatten()),
      400
    );
  }

  try {
    const created = await createVoucher(parsed.data);
    return c.json(success({ voucher: created, message: "Voucher created successfully" }), 201);
  } catch (err: any) {
    if (err?.code === "CODE_EXISTS") {
      return c.json(error("CODE_EXISTS", err.message), 409);
    }
    if (err?.code === "INVALID_VALUE" || err?.code === "INVALID_CODE") {
      return c.json(error("VALIDATION_ERROR", err.message), 400);
    }
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to create voucher"), 500);
  }
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

vouchersRoute.patch("/:id/status", requireAdminAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(error("VALIDATION_ERROR", "isActive boolean is required"), 400);
  }

  try {
    const updated = await toggleVoucherStatus(id, parsed.data.isActive);
    if (!updated) {
      return c.json(error("NOT_FOUND", "Voucher not found"), 404);
    }
    return c.json(success({ voucher: updated, message: "Voucher status updated" }));
  } catch (err: any) {
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to update voucher"), 500);
  }
});

vouchersRoute.delete("/:id", requireAdminAuth, async (c) => {
  const id = c.req.param("id");

  try {
    const deleted = await deleteVoucher(id);
    if (!deleted) {
      return c.json(error("NOT_FOUND", "Voucher not found"), 404);
    }
    return c.json(success({ message: "Voucher deleted successfully" }));
  } catch (err: any) {
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to delete voucher"), 500);
  }
});

vouchersRoute.get("/:id/redemptions", requireAdminAuth, async (c) => {
  const id = c.req.param("id");

  try {
    const redemptions = await getVoucherRedemptions(id);
    return c.json(success(redemptions));
  } catch (err: any) {
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to retrieve redemptions"), 500);
  }
});

export default vouchersRoute;
