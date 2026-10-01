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

