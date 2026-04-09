import { apiRequest } from "@/lib/apiClient";

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  width?: "full" | "half" | "third";
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  validation?: Record<string, unknown>;
  conditional?: Record<string, unknown>;
  order?: number;
}

export interface Form {
  id: string;
  name: string;
  description?: string | null;
  fieldsCount: number;
  isPublished: boolean;
  isActive: boolean;
  leadsCount: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormDetail extends Form {
  fields: FormField[];
  settings: Record<string, unknown>;
  organizationId: string;
}

export interface FormsListResponse {
  success: boolean;
  data: Form[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface FormDetailResponse {
  success: boolean;
  data: FormDetail;
}

export interface CreateFormPayload {
  name: string;
  description?: string;
  fields?: FormField[];
  settings?: Record<string, unknown>;
}

export interface UpdateFormPayload {
  name?: string;
  description?: string;
  fields?: FormField[];
  settings?: Record<string, unknown>;
  isPublished?: boolean;
  isActive?: boolean;
}

export interface GetFormsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "published" | "draft";
}

export async function getFormsApi(params: GetFormsParams = {}): Promise<FormsListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest<FormsListResponse>(`/forms?${query}`);
}

export async function getFormApi(id: string): Promise<FormDetailResponse> {
  return apiRequest<FormDetailResponse>(`/forms/${id}`);
}

export async function getPublishedFormApi(id: string): Promise<FormDetailResponse> {
  return apiRequest<FormDetailResponse>(`/forms/public/${id}`);
}

export async function createFormApi(payload: CreateFormPayload): Promise<{ success: boolean; data: Form }> {
  return apiRequest("/forms", { method: "POST", body: payload });
}

export async function updateFormApi(id: string, payload: UpdateFormPayload): Promise<{ success: boolean; data: Form }> {
  return apiRequest(`/forms/${id}`, { method: "PATCH", body: payload });
}

export async function deleteFormApi(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/forms/${id}`, { method: "DELETE" });
}

export async function duplicateFormApi(id: string): Promise<{ success: boolean; data: Form }> {
  return apiRequest(`/forms/${id}/duplicate`, { method: "POST" });
}

export async function togglePublishApi(id: string): Promise<{ success: boolean; data: Form }> {
  return apiRequest(`/forms/${id}/toggle-publish`, { method: "POST" });
}
