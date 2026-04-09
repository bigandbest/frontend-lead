import { apiRequest } from "@/lib/apiClient";

export interface Team {
  id: string;
  name: string;
  description?: string;
  type: "field" | "marketing";
  isActive: boolean;
  membersCount?: number;
  leadsCount?: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface TeamDetailResponse {
  success: boolean;
  data: Team & { members: TeamMember[] };
}

export interface TeamsListResponse {
  success: boolean;
  data: Team[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateTeamPayload {
  name: string;
  type: "field" | "marketing";
  description?: string;
  settings?: Record<string, unknown>;
}

export interface GetTeamsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export async function getTeamsApi(params: GetTeamsParams = {}): Promise<TeamsListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest<TeamsListResponse>(`/teams?${query}`);
}

export async function getTeamApi(id: string): Promise<TeamDetailResponse> {
  return apiRequest<TeamDetailResponse>(`/teams/${id}`);
}

export async function createTeamApi(payload: CreateTeamPayload): Promise<{ success: boolean; data: Team }> {
  return apiRequest("/teams", { method: "POST", body: payload });
}

export async function updateTeamApi(id: string, payload: Partial<CreateTeamPayload>): Promise<{ success: boolean; data: Team }> {
  return apiRequest(`/teams/${id}`, { method: "PATCH", body: payload });
}

export async function addTeamMemberApi(teamId: string, userId: string): Promise<{ success: boolean }> {
  return apiRequest(`/teams/${teamId}/members`, { method: "POST", body: { userId } });
}

export async function removeTeamMemberApi(teamId: string, userId: string): Promise<{ success: boolean }> {
  return apiRequest(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
}
