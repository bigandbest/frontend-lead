import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getInvoicesApi,
  getInvoiceApi,
  createInvoiceApi,
  updateInvoiceApi,
  getInvoiceStatsApi,
  getInvoiceCustomersApi,
  getInvoiceCustomerApi,
  updateCustomerTagsApi,
  getInvoiceProductsApi,
  createInvoiceProductApi,
  updateInvoiceProductApi,
  deleteInvoiceProductApi,
  getAllInvoicesForExportApi,
  type GetInvoicesParams,
  type GetCustomersParams,
  type CreateInvoicePayload,
  type UpdateInvoicePayload,
  type CreateInvoiceProductPayload,
  type UpdateInvoiceProductPayload,
} from "@/api/invoices";
import { exportInvoicesToExcel } from "@/utils/excel-export";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params: GetInvoicesParams) => ["invoices", "list", params] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
  stats: ["invoices", "stats"] as const,
  customers: {
    all: ["invoice-customers"] as const,
    list: (params: GetCustomersParams) => ["invoice-customers", "list", params] as const,
    detail: (id: string) => ["invoice-customers", "detail", id] as const,
  },
  products: {
    all: ["invoice-products"] as const,
    list: (params: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
      ["invoice-products", "list", params] as const,
  },
};

export function useInvoices(params: GetInvoicesParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoicesApi(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceApi(id),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: invoiceKeys.stats,
    queryFn: getInvoiceStatsApi,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoiceApi(payload),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data.invoiceNumber} created`);
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      qc.invalidateQueries({ queryKey: invoiceKeys.customers.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create invoice"),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoicePayload }) =>
      updateInvoiceApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Invoice updated");
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update invoice"),
  });
}

// ─── Customer Hooks ───────────────────────────────────────────────────────────

export function useInvoiceCustomers(params: GetCustomersParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.customers.list(params),
    queryFn: () => getInvoiceCustomersApi(params),
  });
}

export function useInvoiceCustomer(id: string) {
  return useQuery({
    queryKey: invoiceKeys.customers.detail(id),
    queryFn: () => getInvoiceCustomerApi(id),
    enabled: !!id,
  });
}

export function useUpdateCustomerTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => updateCustomerTagsApi(id, tags),
    onSuccess: (_, { id }) => {
      toast.success("Customer tags updated");
      qc.invalidateQueries({ queryKey: invoiceKeys.customers.detail(id) });
      qc.invalidateQueries({ queryKey: invoiceKeys.customers.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update tags"),
  });
}

export function useInvoiceProducts(params: { page?: number; limit?: number; search?: string; isActive?: boolean } = { limit: 200, isActive: true }) {
  return useQuery({
    queryKey: invoiceKeys.products.list(params),
    queryFn: () => getInvoiceProductsApi(params),
  });
}

export function useCreateInvoiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceProductPayload) => createInvoiceProductApi(payload),
    onSuccess: () => {
      toast.success("Product added to catalog");
      qc.invalidateQueries({ queryKey: invoiceKeys.products.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create product"),
  });
}

export function useUpdateInvoiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoiceProductPayload }) =>
      updateInvoiceProductApi(id, payload),
    onSuccess: () => {
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: invoiceKeys.products.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update product"),
  });
}

export function useDeleteInvoiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoiceProductApi(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: invoiceKeys.products.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete product"),
  });
}

// ─── Export Hook ──────────────────────────────────────────────────────────────

export function useExportInvoices() {
  return useMutation({
    mutationFn: async (params: GetInvoicesParams = {}) => {
      const response = await getAllInvoicesForExportApi(params);
      if (!response.success || !response.data.length) {
        throw new Error("No invoices to export");
      }
      const filename = `invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportInvoicesToExcel(response.data, filename);
      return response;
    },
    onSuccess: () => {
      toast.success("Invoices exported successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to export invoices");
    },
  });
}
