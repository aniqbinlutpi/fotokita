import { handleApiResponse } from "./client";
import type { Wedding, CreateWeddingInput } from "@/types/wedding";

const WEDDINGS_BASE_URL = import.meta.env.VITE_WEDDING_API_URL || "/api/weddings";

export async function getWeddings(): Promise<Wedding[]> {
  const response = await fetch(WEDDINGS_BASE_URL);
  return handleApiResponse<Wedding[]>(response);
}

export async function getWeddingById(id: string): Promise<Wedding> {
  const response = await fetch(`${WEDDINGS_BASE_URL}/${encodeURIComponent(id)}`);
  return handleApiResponse<Wedding>(response);
}

export async function createWedding(input: CreateWeddingInput): Promise<Wedding> {
  const response = await fetch(WEDDINGS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleApiResponse<Wedding>(response);
}

export async function updateWedding(
  id: string,
  input: Partial<CreateWeddingInput>
): Promise<Wedding> {
  const response = await fetch(`${WEDDINGS_BASE_URL}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleApiResponse<Wedding>(response);
}

