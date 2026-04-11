import { apiRequest } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled" | "void";

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxRatePct: number;
  amount: number;
  order: number;
}

export interface InvoiceCustomer {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  tags: string[];
  totalSpend: number;
  invoiceCount: number;
  lastInvoiceAt: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  currency: string;
  invoiceDate: string;
  dueDate: string | null;
  createdById: string;
  createdByName: string;
  templateId: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
  locationAddress: string | null;
}

export interface InvoiceDetail extends Invoice {
  lineItems: InvoiceLineItem[];
  customer: InvoiceCustomer;
  customerSnapshot: Record<string, unknown>;
  formData: Record<string, unknown>;
  notes: string | null;
  paidAt: string | null;
  leadId: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAddress: string | null;
}

export interface InvoiceStats {
  total: number;
  byStatus: Record<InvoiceStatus, number>;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  thisMonthCount: number;
  thisMonthRevenue: number;
}

export interface CreateLineItemInput {
  description: string;
  hsnCode?: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  discountPct?: number;
  taxRatePct?: number;
  order?: number;
}

export interface InvoiceProduct {
  id: string;
  name: string;
  hsnCode: string;
  unitPrice: number;
  taxRatePct: number;
  isActive: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceProductPayload {
  name: string;
  hsnCode: string;
  unitPrice: number;
  taxRatePct: number;
}

export interface UpdateInvoiceProductPayload {
  name?: string;
  hsnCode?: string;
  unitPrice?: number;
  taxRatePct?: number;
  isActive?: boolean;
}

export interface CreateInvoicePayload {
  templateId: string;
  customer: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    leadId?: string;
  };
  lineItems: CreateLineItemInput[];
  discount?: number;
  taxRate?: number;
  currency?: string;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  formData?: Record<string, unknown>;
  leadId?: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
}

export interface UpdateInvoicePayload {
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string | null;
  paidAt?: string | null;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  customerId?: string;
  templateId?: string;
  createdById?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── API Functions ──────────────────────────────────────────────���─────────────

export async function getInvoicesApi(
  params: GetInvoicesParams = {}
): Promise<{ success: boolean; data: Invoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return apiRequest(`/invoices?${q}`);
}

export async function getInvoiceApi(id: string): Promise<{ success: boolean; data: InvoiceDetail }> {
  return apiRequest(`/invoices/${id}`);
}

export async function createInvoiceApi(
  payload: CreateInvoicePayload
): Promise<{ success: boolean; data: InvoiceDetail }> {
  return apiRequest("/invoices", { method: "POST", body: payload });
}

export async function updateInvoiceApi(
  id: string,
  payload: UpdateInvoicePayload
): Promise<{ success: boolean; data: InvoiceDetail }> {
  return apiRequest(`/invoices/${id}`, { method: "PATCH", body: payload });
}

export async function getInvoiceStatsApi(): Promise<{ success: boolean; data: InvoiceStats }> {
  return apiRequest("/invoices/stats");
}

export async function getInvoiceCustomersApi(
  params: GetCustomersParams = {}
): Promise<{ success: boolean; data: InvoiceCustomer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return apiRequest(`/invoices/customers/list?${q}`);
}

export async function getInvoiceCustomerApi(
  id: string
): Promise<{ success: boolean; data: InvoiceCustomer & { recentInvoices: Invoice[] } }> {
  return apiRequest(`/invoices/customers/${id}`);
}

export async function updateCustomerTagsApi(
  id: string,
  tags: string[]
): Promise<{ success: boolean; data: InvoiceCustomer }> {
  return apiRequest(`/invoices/customers/${id}/tags`, { method: "PATCH", body: { tags } });
}

export async function getInvoiceProductsApi(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
} = {}): Promise<{ success: boolean; data: InvoiceProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return apiRequest(`/invoices/products?${q}`);
}

export async function createInvoiceProductApi(
  payload: CreateInvoiceProductPayload
): Promise<{ success: boolean; data: InvoiceProduct }> {
  return apiRequest('/invoices/products', { method: 'POST', body: payload });
}

export async function updateInvoiceProductApi(
  id: string,
  payload: UpdateInvoiceProductPayload
): Promise<{ success: boolean; data: InvoiceProduct }> {
  return apiRequest(`/invoices/products/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteInvoiceProductApi(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/invoices/products/${id}`, { method: 'DELETE' });
}

// ─── Export API Function ────────────────────────────────────────────────────────

export async function getAllInvoicesForExportApi(params: GetInvoicesParams = {}): Promise<{ success: boolean; data: Invoice[] }> {
  const q = new URLSearchParams();
  // Set a high limit to fetch all invoices
  const exportParams = { ...params, limit: 10000 };
  Object.entries(exportParams).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  const response = await apiRequest<{ success: boolean; data: Invoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/invoices?${q}`);
  return {
    success: response.success,
    data: response.data,
  };
}
