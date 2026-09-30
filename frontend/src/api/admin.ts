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
