import { apiRequest } from "@/lib/apiClient";

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  status: string;
  priority: string;
  source?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  tags?: string[];
  dealValue?: number;
  followUpAt?: string;
  formId?: string;
  formData?: Record<string, unknown>;
  assignedToId?: string;
  assignedToName?: string;
  createdById?: string;
  createdByName?: string;
  createdByEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsListResponse {
  success: boolean;
  data: Lead[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface LeadDetailResponse {
  success: boolean;
  data: Lead;
}

export interface LeadStatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: Record<string, number>;
    todayCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
  };
}

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
  assignedToId?: string;
  hasFollowUp?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateLeadPayload {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  source?: string;
  priority?: string;
  notes?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  assignedToId?: string;
  formId?: string;
  formData?: Record<string, unknown>;
  campaignId?: string;
}

export interface UpdateLeadPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  notes?: string;
  followUpAt?: string;
  dealValue?: number;
  tags?: string[];
}

function normalizeIndianPhone(input?: string): string | undefined {
  if (!input) return input;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function normalizeLeadSource(source?: string): string | undefined {
  if (!source) return source;
  return source === "telecalling" ? "api" : source;
}

export async function getLeadsApi(params: GetLeadsParams = {}): Promise<LeadsListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    if (k === "source") {
      query.set(k, String(normalizeLeadSource(String(v))));
      return;
    }
    query.set(k, String(v));
  });
  return apiRequest<LeadsListResponse>(`/leads?${query}`);
}

export async function getLeadStatsApi(): Promise<LeadStatsResponse> {
  return apiRequest<LeadStatsResponse>("/leads/stats");
}

export async function getLeadApi(id: string): Promise<LeadDetailResponse> {
  return apiRequest<LeadDetailResponse>(`/leads/${id}`);
}

export async function createLeadApi(payload: CreateLeadPayload): Promise<LeadDetailResponse> {
  return apiRequest<LeadDetailResponse>("/leads", {
    method: "POST",
    body: {
      ...payload,
      source: normalizeLeadSource(payload.source),
      phone: normalizeIndianPhone(payload.phone) ?? payload.phone,
    },
  });
}

export async function updateLeadApi(id: string, payload: UpdateLeadPayload): Promise<LeadDetailResponse> {
  return apiRequest<LeadDetailResponse>(`/leads/${id}`, { method: "PATCH", body: payload });
}

export async function deleteLeadApi(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/leads/${id}`, { method: "DELETE" });
}

export async function bulkAssignLeadsApi(leadIds: string[], assignedToId: string): Promise<{ success: boolean }> {
  return apiRequest("/leads/bulk/assign", { method: "POST", body: { leadIds, assignedToId } });
}

export async function bulkUpdateLeadStatusApi(leadIds: string[], status: string): Promise<{ success: boolean }> {
  return apiRequest("/leads/bulk/status", { method: "POST", body: { leadIds, status } });
}

export interface LeadActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export async function getLeadActivitiesApi(leadId: string, page = 1, limit = 20) {
  return apiRequest<{ success: boolean; data: LeadActivity[]; pagination: unknown }>(
    `/leads/${leadId}/activities?page=${page}&limit=${limit}`
  );
}

export async function addLeadActivityApi(leadId: string, payload: { type: string; title: string; description?: string; metadata?: Record<string, unknown> }) {
  return apiRequest(`/leads/${leadId}/activities`, { method: "POST", body: payload });
}

export async function getAllLeadsForExportApi(
  params: GetLeadsParams = {}
): Promise<{ success: boolean; data: Lead[] }> {
  const exportParams = { ...params, limit: 10000, page: 1 };
  const response = await getLeadsApi(exportParams);
  return {
    success: response.success,
    data: response.data,
  };
}
