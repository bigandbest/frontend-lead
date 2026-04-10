import { apiRequest } from "@/lib/apiClient";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
  budget?: number;
  formId?: string;
  formName?: string | null;
  settings?: Record<string, unknown>;
  leadsCount?: number;
  assignedTeamsCount?: number;
  assignedUsersCount?: number;
  createdAt: string;
}

export interface CampaignTeam {
  teamId: string;
  teamName: string;
  membersCount: number;
}

export interface CampaignUser {
  userId: string;
  userName: string;
  role: string;
  teamName: string | null;
}

export interface CampaignStatsData {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsToday: number;
  leadsThisWeek: number;
  conversionRate: number;
  totalCallsMade: number;
  avgLeadsPerDay: number;
  daysRemaining: number | null;
  budgetSpent: number | null;
  budgetRemaining: number | null;
  topPerformer: { userId: string; userName: string; leadsCount: number } | null;
}

export interface CampaignDetail extends Campaign {
  targetAudience?: Record<string, unknown>;
  settings: {
    dailyLeadTarget?: number;
    maxLeadsTotal?: number;
    allowDuplicates?: boolean;
    autoAssign?: boolean;
    autoAssignStrategy?: string;
    requireGeolocation?: boolean;
    formRequired?: boolean;
    script?: string;
    incentive?: string;
  };
  metadata: Record<string, unknown>;
  organizationId: string;
  assignedTeams: CampaignTeam[];
  assignedUsers: CampaignUser[];
  stats: CampaignStatsData;
}

export interface CampaignLead {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  email: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

export interface CampaignStats {
  totalLeads: number;
  assignedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  activeAgents: number;
  budgetSpent?: number;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  formId?: string;
  assignedTeamIds?: string[];
  assignedUserIds?: string[];
  settings?: {
    dailyLeadTarget?: number;
    maxLeadsTotal?: number;
    allowDuplicates?: boolean;
    autoAssign?: boolean;
    autoAssignStrategy?: string;
    requireGeolocation?: boolean;
    formRequired?: boolean;
  };
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface GetCampaignsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export async function getCampaignsApi(params: GetCampaignsParams = {}): Promise<{
  success: boolean;
  data: Campaign[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest(`/campaigns?${query}`);
}

export async function getCampaignApi(id: string): Promise<{ success: boolean; data: CampaignDetail }> {
  return apiRequest(`/campaigns/${id}`);
}

export async function getCampaignStatsApi(id: string): Promise<{ success: boolean; data: CampaignStats }> {
  return apiRequest(`/campaigns/${id}/stats`);
}

export async function createCampaignApi(payload: CreateCampaignPayload): Promise<{ success: boolean; data: Campaign }> {
  return apiRequest("/campaigns", { method: "POST", body: payload });
}

export async function updateCampaignApi(id: string, payload: UpdateCampaignPayload): Promise<{ success: boolean; data: Campaign }> {
  return apiRequest(`/campaigns/${id}`, { method: "PATCH", body: payload });
}

export async function updateCampaignStatusApi(id: string, status: string, reason?: string): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/status`, { method: "PATCH", body: { status, reason } });
}

export async function duplicateCampaignApi(id: string): Promise<{ success: boolean; data: Campaign }> {
  return apiRequest(`/campaigns/${id}/duplicate`, { method: "POST" });
}

export async function getCampaignLeadsApi(
  id: string,
  params: { page?: number; limit?: number; status?: string; search?: string } = {}
): Promise<{
  success: boolean;
  data: CampaignLead[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest(`/campaigns/${id}/leads?${query}`);
}

export async function addLeadsToCampaignApi(id: string, leadIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/leads`, { method: "POST", body: { leadIds } });
}

export async function removeLeadsFromCampaignApi(id: string, leadIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/leads/remove`, { method: "POST", body: { leadIds } });
}

export async function assignTeamsApi(id: string, teamIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/teams`, { method: "POST", body: { teamIds } });
}

export async function removeTeamsApi(id: string, teamIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/teams/remove`, { method: "POST", body: { teamIds } });
}

export async function assignUsersApi(id: string, userIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/users`, { method: "POST", body: { userIds } });
}

export async function removeUsersApi(id: string, userIds: string[]): Promise<{ success: boolean }> {
  return apiRequest(`/campaigns/${id}/users/remove`, { method: "POST", body: { userIds } });
}
