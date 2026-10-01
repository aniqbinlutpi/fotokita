import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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

const DATA_DIR = path.resolve(import.meta.dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "inquiries.json");

// Ensure data storage directory and file exist
async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to initialize inquiry data file:", err);
  }
}

async function readAllInquiries(): Promise<CustomerInquiry[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as CustomerInquiry[];
  } catch (err) {
    console.error("Failed to read inquiries:", err);
    return [];
  }
}

async function writeAllInquiries(inquiries: CustomerInquiry[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(inquiries, null, 2), "utf-8");
}

export async function createInquiry(params: {
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  notes?: string;
}): Promise<CustomerInquiry> {
  const inquiry: CustomerInquiry = {
    id: crypto.randomUUID(),
    username: params.username.trim(),
    phone: params.phone.trim(),
    planId: params.planId.trim(),
    planName: params.planName.trim(),
    price: params.price.trim(),
    status: "pending",
    createdAt: Date.now(),
    notes: params.notes?.trim() || undefined,
  };

  const all = await readAllInquiries();
  all.unshift(inquiry);
  await writeAllInquiries(all);

  return inquiry;
}

export async function listInquiries(): Promise<CustomerInquiry[]> {
  return readAllInquiries();
}

export async function updateInquiryStatus(
  id: string,
  status: "pending" | "contacted" | "converted",
  notes?: string
): Promise<CustomerInquiry | null> {
  const all = await readAllInquiries();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  if (!current) return null;

  all[index] = {
    ...current,
    status,
    ...(notes !== undefined ? { notes } : {}),
  };

  await writeAllInquiries(all);
  return all[index];
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const all = await readAllInquiries();
  const filtered = all.filter((i) => i.id !== id);
  if (filtered.length === all.length) return false;
  await writeAllInquiries(filtered);
  return true;
}
