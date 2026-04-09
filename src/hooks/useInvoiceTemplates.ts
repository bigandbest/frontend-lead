import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getInvoiceTemplatesApi,
  getInvoiceTemplateApi,
  createInvoiceTemplateApi,
  updateInvoiceTemplateApi,
  deleteInvoiceTemplateApi,
  duplicateInvoiceTemplateApi,
  type GetInvoiceTemplatesParams,
  type CreateInvoiceTemplatePayload,
  type UpdateInvoiceTemplatePayload,
} from "@/api/invoice-templates";

export const invoiceTemplateKeys = {
  all: ["invoice-templates"] as const,
  list: (params: GetInvoiceTemplatesParams) => ["invoice-templates", "list", params] as const,
  detail: (id: string) => ["invoice-templates", "detail", id] as const,
};

export function useInvoiceTemplates(params: GetInvoiceTemplatesParams = {}) {
  return useQuery({
    queryKey: invoiceTemplateKeys.list(params),
    queryFn: () => getInvoiceTemplatesApi(params),
  });
}

export function useInvoiceTemplate(id: string) {
  return useQuery({
    queryKey: invoiceTemplateKeys.detail(id),
    queryFn: () => getInvoiceTemplateApi(id),
    enabled: !!id,
  });
}

export function useCreateInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceTemplatePayload) => createInvoiceTemplateApi(payload),
    onSuccess: (res) => {
      toast.success(`Template "${res.data.name}" created`);
      qc.invalidateQueries({ queryKey: invoiceTemplateKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create template"),
  });
}

export function useUpdateInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoiceTemplatePayload }) =>
      updateInvoiceTemplateApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: invoiceTemplateKeys.all });
      qc.invalidateQueries({ queryKey: invoiceTemplateKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update template"),
  });
}

export function useDeleteInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoiceTemplateApi(id),
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: invoiceTemplateKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete template"),
  });
}

export function useDuplicateInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateInvoiceTemplateApi(id),
    onSuccess: (res) => {
      toast.success(`Template "${res.data.name}" duplicated`);
      qc.invalidateQueries({ queryKey: invoiceTemplateKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to duplicate template"),
  });
}
