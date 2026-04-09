import { apiRequest } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceFieldRole =
  | "customer_name" | "customer_email" | "customer_phone" | "customer_address"
  | "customer_city" | "customer_state" | "customer_pincode"
  | "line_item_description" | "line_item_quantity" | "line_item_unit_price"
  | "notes" | "custom";

export interface InvoiceTemplateFieldOption {
  label: string;
  value: string;
}

export interface InvoiceTemplateField {
  id: string;
  role: InvoiceFieldRole;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  options?: InvoiceTemplateFieldOption[];
  required?: boolean;
  isMarketingRelevant?: boolean;
  isCustomerField?: boolean;
  isPricingField?: boolean;
  order: number;
  width?: "full" | "half" | "third";
  properties?: Record<string, unknown>;
}

export interface InvoiceTemplateSettings {
  currency?: string;
  defaultTaxRate?: number;
  discountEnabled?: boolean;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  termsAndConditions?: string;
  paymentInstructions?: string;
  lineItemsEnabled?: boolean;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string | null;
  fieldsCount: number;
  isActive: boolean;
  version: number;
  settings: InvoiceTemplateSettings;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTemplateDetail extends InvoiceTemplate {
  fields: InvoiceTemplateField[];
  organizationId: string;
  createdById: string;
}

export interface InvoiceTemplateListResponse {
  success: boolean;
  data: InvoiceTemplate[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface InvoiceTemplateDetailResponse {
  success: boolean;
  data: InvoiceTemplateDetail;
}

export interface CreateInvoiceTemplatePayload {
  name: string;
  description?: string;
  fields?: InvoiceTemplateField[];
  settings?: InvoiceTemplateSettings;
}

export interface UpdateInvoiceTemplatePayload {
  name?: string;
  description?: string;
  fields?: InvoiceTemplateField[];
  settings?: InvoiceTemplateSettings;
  isActive?: boolean;
}

export interface GetInvoiceTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getInvoiceTemplatesApi(
  params: GetInvoiceTemplatesParams = {}
): Promise<InvoiceTemplateListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return apiRequest<InvoiceTemplateListResponse>(`/invoice-templates?${q}`);
}

export async function getInvoiceTemplateApi(id: string): Promise<InvoiceTemplateDetailResponse> {
  return apiRequest<InvoiceTemplateDetailResponse>(`/invoice-templates/${id}`);
}

export async function createInvoiceTemplateApi(
  payload: CreateInvoiceTemplatePayload
): Promise<{ success: boolean; data: InvoiceTemplateDetail }> {
  return apiRequest("/invoice-templates", { method: "POST", body: payload });
}

export async function updateInvoiceTemplateApi(
  id: string,
  payload: UpdateInvoiceTemplatePayload
): Promise<{ success: boolean; data: InvoiceTemplateDetail }> {
  return apiRequest(`/invoice-templates/${id}`, { method: "PATCH", body: payload });
}

export async function deleteInvoiceTemplateApi(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/invoice-templates/${id}`, { method: "DELETE" });
}

export async function duplicateInvoiceTemplateApi(
  id: string
): Promise<{ success: boolean; data: InvoiceTemplateDetail }> {
  return apiRequest(`/invoice-templates/${id}/duplicate`, { method: "POST" });
}
