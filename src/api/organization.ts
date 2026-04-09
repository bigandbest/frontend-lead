import { apiRequest } from "@/lib/apiClient";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings?: {
    timezone?: string;
    currency?: string;
    maxLeadsPerAgent?: number;
    workingHours?: Record<string, { enabled: boolean; start: string; end: string }>;
  };
  isActive: boolean;
  createdAt: string;
}

export interface OrgStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalTeams: number;
  totalForms: number;
  totalCampaigns: number;
}

export async function getOrganizationApi(): Promise<{ success: boolean; data: Organization }> {
  return apiRequest("/organizations/current");
}

export async function updateOrganizationApi(payload: Partial<Pick<Organization, "name" | "logo" | "settings">>): Promise<{
  success: boolean;
  data: Organization;
}> {
  return apiRequest("/organizations/current", { method: "PATCH", body: payload });
}

export async function getOrgStatsApi(): Promise<{ success: boolean; data: OrgStats }> {
  return apiRequest("/organizations/current/stats");
}

export async function getMeApi(): Promise<{ success: boolean; data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  organizationId: string;
  organizationName: string;
} }> {
  return apiRequest("/auth/me");
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  return apiRequest("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
}
