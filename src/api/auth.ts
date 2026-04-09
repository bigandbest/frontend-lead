import { apiRequest } from "@/lib/apiClient";
import type { AuthUser } from "@/stores/authStore";

interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationName: string;
  organizationSlug?: string;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse["data"]> {
  const res = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    auth: false,
  });
  return res.data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse["data"]> {
  const res = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
  return res.data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiRequest("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: true,
  });
}
