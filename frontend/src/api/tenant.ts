import { handleApiResponse } from "./client";

const TENANT_BASE_URL = import.meta.env.VITE_TENANT_API_URL || "/api/tenant";

export interface TenantAccount {
  id: string;
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  role?: string;
  planTier?: string;
  planExpiresAt?: string | null;
  mediaExpiresAt?: string | null;
  preserveMedia?: boolean;
  status?: string;
  mediaCleanedUp?: boolean;
}

export type TextPositionMap = Record<string, { x: number; y: number }>;

export interface TenantCustomization {
  weddingId: string;
  partner1: string;
  partner2: string;
  weddingDate: string;
  eyebrow: string;
  tagline: string;
  themePalette: string; // 'warmGold' | 'roseRomance' | 'emerald' | 'midnight'
  fireworksEnabled: boolean;
  orbStyle: string;
  fontPreset: string;
  partnerFont?: string;
  partnerSize?: string;
  eyebrowFont?: string;
  eyebrowSize?: string;
  dateFont?: string;
  dateSize?: string;
  quoteFont?: string;
  quoteSize?: string;
  ampersandSize?: string;
  orbSize?: string;
  textPositions?: TextPositionMap | null;
  slug?: string;
}

const TOKEN_KEY = "fotokita_tenant_token";
const USER_KEY = "fotokita_tenant_user";

export function getStoredTenantToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredTenantUser(): TenantAccount | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredTenantSession(token: string, tenant: TenantAccount): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(tenant));
}

export function clearStoredTenantSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export interface RegisterTenantInput {
  username: string;
  email?: string;
  password: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  planTier?: string;
}

/**
 * Register newly created Tenant Sub-Admin account in PostgreSQL
 */
export async function registerTenant(
  input: RegisterTenantInput
): Promise<{ token: string; tenant: TenantAccount }> {
  const res = await fetch(`${TENANT_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const body = await handleApiResponse<{ token: string; tenant: TenantAccount }>(res);
  return body;
}

/**
 * Tenant Sub-Admin Login
 */
export async function loginTenant(credentials: {
  identifier: string; // Email or username or slug
  password: string;
}): Promise<{ token: string; tenant: TenantAccount }> {
  const res = await fetch(`${TENANT_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const body = await handleApiResponse<{ token: string; tenant: TenantAccount }>(res);
  setStoredTenantSession(body.token, body.tenant);
  return body;
}

/**
 * Fetch authenticated tenant profile
 */
export async function getTenantProfile(): Promise<TenantAccount> {
  const token = getStoredTenantToken();
  const res = await fetch(`${TENANT_BASE_URL}/auth/me`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await handleApiResponse<{ tenant: TenantAccount }>(res);
  return body.tenant;
}

/**
 * Fetch wedding custom styling and deco
 */
export async function getTenantCustomization(weddingId: string): Promise<TenantCustomization> {
  const res = await fetch(`${TENANT_BASE_URL}/customization/${encodeURIComponent(weddingId)}`);
  const body = await handleApiResponse<TenantCustomization>(res);
  return body;
}

/**
 * Update wedding custom styling and deco (Sub-Admin access)
 */
export async function updateTenantCustomization(
  weddingId: string,
  customization: Partial<TenantCustomization>
): Promise<TenantCustomization> {
  const token = getStoredTenantToken();
  const res = await fetch(`${TENANT_BASE_URL}/customization/${encodeURIComponent(weddingId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(customization),
  });

  const body = await handleApiResponse<TenantCustomization>(res);
  return body;
}
