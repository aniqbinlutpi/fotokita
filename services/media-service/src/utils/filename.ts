import { basename } from "node:path";

/**
 * Sanitizes an uploaded filename by:
 * 1. Normalizing backslashes to forward slashes.
 * 2. Extracting only the basename to prevent path traversal (e.g. "../../secret.txt" -> "secret.txt").
 * 3. Stripping ASCII control characters (0x00-0x1F, 0x7F) including null bytes.
 * 4. Removing leading dots and whitespace to prevent hidden files or dot navigation.
 * 5. Providing a safe fallback if empty after sanitization.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "unnamed_file";
  }

  // Normalize Windows separators to POSIX
  const normalized = filename.replace(/\\/g, "/");

  // Extract base filename (removes directory components)
  const base = basename(normalized);

  // Strip ASCII control characters (including null bytes)
  const withoutControlChars = base.replace(/[\x00-\x1F\x7F]/g, "").trim();

  // Strip leading dots, slashes, and whitespace
  const safe = withoutControlChars.replace(/^[.\s/]+/, "");

  return safe || "unnamed_file";
}
