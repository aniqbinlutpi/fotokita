import { Hono } from "hono";
import { z } from "zod";
import {
  createInquiry,
  listInquiries,
  updateInquiryStatus,
  deleteInquiry,
  checkInquiryAvailability,
} from "../lib/inquiries";
import { requireAdminAuth } from "./auth";
import { success, error } from "../lib/response";

const inquiriesRoute = new Hono();

// PUBLIC ENDPOINT: Check username and/or phone availability before submitting
inquiriesRoute.get("/check-availability", async (c) => {
  const username = c.req.query("username");
  const phone = c.req.query("phone");

  try {
    const result = await checkInquiryAvailability({
      username: username || undefined,
      phone: phone || undefined,
    });
    return c.json(success(result));
  } catch (err: any) {
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to check availability"), 500);
  }
});

const createInquirySchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, underscores (_), and dots (.)"
    )
    .transform((val) => val.toLowerCase()),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  planId: z.string().min(1, "Plan ID is required"),
  planName: z.string().min(1, "Plan name is required"),
  price: z.string().min(1, "Plan price is required"),
  weddingDate: z.string().optional(),
  planStartDate: z.string().optional(),
  notes: z.string().optional(),
});

// PUBLIC ENDPOINT: Submit customer WhatsApp inquiry from Landing Page
inquiriesRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createInquirySchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      error("VALIDATION_ERROR", "Please provide a valid username and phone number", parsed.error.flatten()),
      400
    );
  }

  try {
    const inquiry = await createInquiry(parsed.data);
    return c.json(success({ inquiry, message: "Inquiry saved successfully" }), 201);
  } catch (err: any) {
    if (err?.code === "USERNAME_TAKEN") {
      return c.json(error("USERNAME_TAKEN", err.message || "This username is already taken."), 409);
    }
    if (err?.code === "PHONE_TAKEN") {
      return c.json(error("PHONE_TAKEN", err.message || "This phone number has already submitted an inquiry."), 409);
    }
    if (err?.code === "DUPLICATE_ENTRY") {
      return c.json(error("DUPLICATE_ENTRY", err.message || "An inquiry with these details already exists."), 409);
    }
    return c.json(error("INTERNAL_ERROR", err?.message || "Failed to save inquiry"), 500);
  }
});

// ADMIN PROTECTED ROUTES:
inquiriesRoute.get("/", requireAdminAuth, async (c) => {
  const list = await listInquiries();
  return c.json(success(list));
});

inquiriesRoute.patch("/:id", requireAdminAuth, async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: "pending" | "contacted" | "converted";
    notes?: string;
  };

  const status = body.status;
  if (status && !["pending", "contacted", "converted"].includes(status)) {
    return c.json(error("VALIDATION_ERROR", "Invalid inquiry status"), 400);
  }

  const updated = await updateInquiryStatus(id, status || "contacted", body.notes);
  if (!updated) {
    return c.json(error("NOT_FOUND", "Inquiry not found"), 404);
  }

  return c.json(success({ inquiry: updated }));
});

inquiriesRoute.delete("/:id", requireAdminAuth, async (c) => {
  const id = c.req.param("id");
  const ok = await deleteInquiry(id);
  if (!ok) {
    return c.json(error("NOT_FOUND", "Inquiry not found"), 404);
  }
  return c.json(success({ message: "Inquiry deleted successfully" }));
});

export default inquiriesRoute;
