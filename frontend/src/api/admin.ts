import { handleApiResponse } from "./client";
import type { Wedding } from "@/types/wedding";

const ADMIN_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || "/api/admin";

export interface AdminUser {
  username: string;
  role: "superadmin";
  name: string;
}

export interface AdminAuthResponse {
  token: string;
  user: AdminUser;
}

export interface AdminStats {
  totalWeddings: number;
  totalMedia: number;
  services: {
    weddingService: "ok" | "down";
    mediaService: "ok" | "down";
    adminService: "ok" | "down";
  };
  recentWeddings: Wedding[];
}

export interface AdminHealth {
  timestamp: string;
  services: {
    weddingService: boolean;
    mediaService: boolean;
    adminService: boolean;
  };
}

const TOKEN_KEY = "fotokita_admin_token";
const USER_KEY = "fotokita_admin_user";

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredAdminUser(): AdminUser | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredAdminSession(token: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAdminSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loginAdmin(credentials: {
  username: string;
  password: string;
}): Promise<AdminAuthResponse> {
  const response = await fetch(`${ADMIN_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const result = await handleApiResponse<AdminAuthResponse>(response);
  if (result.token && result.user) {
    setStoredAdminSession(result.token, result.user);
  }
  return result;
}

export async function getAdminMe(): Promise<{ user: AdminUser }> {
  const response = await fetch(`${ADMIN_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<{ user: AdminUser }>(response);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const response = await fetch(`${ADMIN_BASE_URL}/auth/verify-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });
  const result = await handleApiResponse<{ verified: boolean }>(response);
  return result.verified;
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${ADMIN_BASE_URL}/stats`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<AdminStats>(response);
}

export async function getAdminWeddings(): Promise<Wedding[]> {
  const response = await fetch(`${ADMIN_BASE_URL}/weddings`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<Wedding[]>(response);
}

export async function createAdminWedding(data: {
  name: string;
  slug: string;
  date: string;
}): Promise<Wedding> {
  const response = await fetch(`${ADMIN_BASE_URL}/weddings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleApiResponse<Wedding>(response);
}

export async function deleteAdminWedding(id: string): Promise<{ message: string }> {
  const response = await fetch(`${ADMIN_BASE_URL}/weddings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleApiResponse<{ message: string }>(response);
}

export async function getAdminHealth(): Promise<AdminHealth> {
  const response = await fetch(`${ADMIN_BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<AdminHealth>(response);
}

// -------------------------------------------------------------
// INVITE LINKS & ONBOARDING (24h Single-Use Tier Tokens)
// -------------------------------------------------------------

export type SubscriptionTier =
  | "12h"
  | "1day"
  | "3days"
  | "1week"
  | "1month"
  | "1year"
  | "standard"
  | "premium"
  | "vip"
  | (string & {});

export interface TenantRegistrationDetails {
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  registeredAt: number;
}

export interface AdminInvite {
  id: string;
  token: string;
  tier: SubscriptionTier;
  clientName?: string;
  notes?: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
  usedAt?: number;
  status: "active" | "used" | "expired";
  remainingMinutes: number;
  registrationDetails?: TenantRegistrationDetails;
}

export interface CreateInviteResponse {
  invite: AdminInvite;
  invitePath: string;
  message: string;
}

export interface VerifyInviteResponse {
  valid: boolean;
  token: string;
  tier: SubscriptionTier;
  clientName?: string;
  expiresAt: number;
  remainingMs: number;
}

export async function getAdminInvites(): Promise<AdminInvite[]> {
  const response = await fetch(`${ADMIN_BASE_URL}/invites`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<AdminInvite[]>(response);
}

export async function createAdminInvite(params: {
  tier: SubscriptionTier;
  clientName?: string;
  notes?: string;
}): Promise<CreateInviteResponse> {
  const response = await fetch(`${ADMIN_BASE_URL}/invites`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  return handleApiResponse<CreateInviteResponse>(response);
}

export async function deleteAdminInvite(id: string): Promise<{ message: string }> {
  const response = await fetch(`${ADMIN_BASE_URL}/invites/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleApiResponse<{ message: string }>(response);
}

export async function verifyInviteToken(token: string): Promise<VerifyInviteResponse> {
  const response = await fetch(`${ADMIN_BASE_URL}/invites/verify?token=${encodeURIComponent(token)}`);
  return handleApiResponse<VerifyInviteResponse>(response);
}

export async function redeemInviteToken(data: {
  token: string;
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
}): Promise<{ message: string; invite: AdminInvite }> {
  const response = await fetch(`${ADMIN_BASE_URL}/invites/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ message: string; invite: AdminInvite }>(response);
}

// -------------------------------------------------------------
// CLIENT INQUIRIES & WHATSAPP LEADS
// -------------------------------------------------------------

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

export async function submitCustomerInquiry(data: {
  username: string;
  phone: string;
  planId: string;
  planName: string;
  price: string;
  notes?: string;
}): Promise<{ inquiry: CustomerInquiry; message: string }> {
  const response = await fetch(`${ADMIN_BASE_URL}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ inquiry: CustomerInquiry; message: string }>(response);
}

export async function getAdminInquiries(): Promise<CustomerInquiry[]> {
  const response = await fetch(`${ADMIN_BASE_URL}/inquiries`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<CustomerInquiry[]>(response);
}

export async function updateAdminInquiryStatus(
  id: string,
  status: "pending" | "contacted" | "converted",
  notes?: string
): Promise<{ inquiry: CustomerInquiry }> {
  const response = await fetch(`${ADMIN_BASE_URL}/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  });
  return handleApiResponse<{ inquiry: CustomerInquiry }>(response);
}

export async function deleteAdminInquiry(id: string): Promise<{ message: string }> {
  const response = await fetch(`${ADMIN_BASE_URL}/inquiries/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleApiResponse<{ message: string }>(response);
}

// -------------------------------------------------------------
// TENANT SUBSCRIBER MANAGEMENT & RETENTION CONTROLS
// -------------------------------------------------------------

export interface AdminTenantAccount {
  id: string;
  username: string;
  email: string;
  weddingId: string;
  weddingSlug: string;
  weddingName: string;
  planTier: string;
  planExpiresAt: string | null;
  mediaExpiresAt: string | null;
  preserveMedia: boolean;
  status: "active" | "plan_expired" | "archived";
  mediaCleanedUp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionStats {
  totalSubscribers: number;
  activeSubscribers: number;
  planExpired: number;
  archived: number;
  preservedCount: number;
}

const TENANT_API_URL = import.meta.env.VITE_TENANT_API_URL || "/api/tenant";

export async function getAdminTenantAccounts(): Promise<AdminTenantAccount[]> {
  const res = await fetch(`${TENANT_API_URL}/accounts`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<AdminTenantAccount[]>(res);
}

export async function getAdminSubscriptionStats(): Promise<AdminSubscriptionStats> {
  const res = await fetch(`${TENANT_API_URL}/maintenance/stats`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<AdminSubscriptionStats>(res);
}

export async function toggleAdminPreserveMedia(
  weddingId: string,
  preserveMedia: boolean
): Promise<{ weddingId: string; preserveMedia: boolean; message: string }> {
  const res = await fetch(`${TENANT_API_URL}/accounts/${encodeURIComponent(weddingId)}/preserve-media`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preserveMedia }),
  });
  return handleApiResponse<{ weddingId: string; preserveMedia: boolean; message: string }>(res);
}

export async function triggerAdminMediaCleanup(): Promise<{
  processedCount: number;
  cleanedTenants: any[];
  errors: any[];
}> {
  const res = await fetch(`${TENANT_API_URL}/maintenance/cleanup`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleApiResponse<any>(res);
}

const MEDIA_API_URL = import.meta.env.VITE_MEDIA_API_URL || "/api/media";
const WEDDING_API_URL = import.meta.env.VITE_WEDDINGS_API_URL || "/api/weddings";

/**
 * Completely purges a wedding:
 * 1. Storage & Media: Deletes all S3/R2 files and media DB rows via Media Service
 * 2. User & Tenant: Deletes tenant credentials & customizations via Tenant Service
 * 3. Wedding: Deletes wedding entity via Wedding Service
 */
export async function purgeEntireWedding(weddingId: string): Promise<void> {
  // 1. Delete all images & media files from S3/R2 and database
  try {
    await fetch(`${MEDIA_API_URL}/wedding/${encodeURIComponent(weddingId)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("Failed to purge media during wedding deletion:", err);
  }

  // 2. Delete tenant account and customizations
  try {
    await fetch(`${TENANT_API_URL}/accounts/${encodeURIComponent(weddingId)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("Failed to delete tenant account during wedding deletion:", err);
  }

  // 3. Delete wedding record
  const res = await fetch(`${WEDDING_API_URL}/${encodeURIComponent(weddingId)}`, {
    method: "DELETE",
  });
  await handleApiResponse<{ message: string }>(res);
}


