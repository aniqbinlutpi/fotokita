import { randomUUID } from "node:crypto";
import { extname } from "node:path";

export function generateStorageKey(
  weddingId: string,
  filename: string,
) {
  const extension = extname(filename).toLowerCase();
  const id = randomUUID();

  return `weddings/${weddingId}/${id}${extension}`;
}
