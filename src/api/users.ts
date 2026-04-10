import { apiRequest } from "@/lib/apiClient";

export interface User {
  id: string;
  employeeId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  teamId?: string;
  teamName?: string;
  reportingToId?: string;
  leadsCount?: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UsersListResponse {
  success: boolean;
  data: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  teamId?: string;
  reportingToId?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  teamId?: string;
  reportingToId?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  teamId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getUsersApi(params: GetUsersParams = {}): Promise<UsersListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest<UsersListResponse>(`/users?${query}`);
}

export async function getUserApi(id: string): Promise<UserDetailResponse> {
  return apiRequest<UserDetailResponse>(`/users/${id}`);
}

export async function createUserApi(payload: CreateUserPayload): Promise<UserDetailResponse> {
  return apiRequest<UserDetailResponse>("/users", { method: "POST", body: payload });
}

export async function updateUserApi(id: string, payload: UpdateUserPayload): Promise<UserDetailResponse> {
  return apiRequest<UserDetailResponse>(`/users/${id}`, { method: "PATCH", body: payload });
}

export async function deactivateUserApi(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/users/${id}`, { method: "DELETE" });
}

export async function activateUserApi(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/users/${id}/activate`, { method: "POST" });
}
