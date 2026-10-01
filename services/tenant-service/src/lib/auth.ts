const JWT_SECRET = process.env.JWT_SECRET || "fotokita-tenant-secret-2026";

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export interface TenantPayload {
  tenantId: string;
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  role: "subadmin";
  exp: number;
}

export async function createTenantToken(
  payload: Omit<TenantPayload, "exp" | "role">,
  expiresInSeconds = 7 * 86400 // 7 days session
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: TenantPayload = {
    ...payload,
    role: "subadmin",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const signature = Buffer.from(signatureBuffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyTenantToken(token: string): Promise<TenantPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const key = await getCryptoKey();

    let sigBase64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (sigBase64.length % 4) {
      sigBase64 += "=";
    }
    const sigBuffer = Buffer.from(sigBase64, "base64");

    const isValid = await crypto.subtle.verify("HMAC", key, sigBuffer, data);
    if (!isValid) return null;

    const payload: TenantPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
