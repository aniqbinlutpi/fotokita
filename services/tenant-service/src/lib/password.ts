import { timingSafeEqual } from "node:crypto";

const HASH_PREFIXES = ["$argon2", "$2a$", "$2b$", "$2y$"];

const isHashed = (stored: string) => HASH_PREFIXES.some((p) => stored.startsWith(p));

export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

/**
 * Verifies a login password. Accounts created before hashing was introduced still hold
 * plaintext; those match once and are flagged so the caller can re-save them hashed.
 */
export async function verifyPassword(
  stored: string,
  input: string
): Promise<{ isMatch: boolean; needsRehash: boolean }> {
  if (isHashed(stored)) {
    return { isMatch: await Bun.password.verify(input, stored), needsRehash: false };
  }
  const a = Buffer.from(stored);
  const b = Buffer.from(input);
  const isMatch = a.length === b.length && timingSafeEqual(a, b);
  return { isMatch, needsRehash: isMatch };
}
