import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFormsApi,
  getFormApi,
  getPublishedFormApi,
  createFormApi,
  updateFormApi,
  deleteFormApi,
  duplicateFormApi,
  togglePublishApi,
  type GetFormsParams,
  type CreateFormPayload,
  type UpdateFormPayload,
} from "@/api/forms";

export const formKeys = {
  all: ["forms"] as const,
  list: (params: GetFormsParams) => ["forms", "list", params] as const,
  detail: (id: string) => ["forms", "detail", id] as const,
  public: (id: string) => ["forms", "public", id] as const,
};

export function useForms(params: GetFormsParams = {}) {
  return useQuery({
    queryKey: formKeys.list(params),
    queryFn: () => getFormsApi(params),
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => getFormApi(id),
    enabled: !!id,
  });
}

export function usePublishedForm(id: string) {
  return useQuery({
    queryKey: formKeys.public(id),
    queryFn: () => getPublishedFormApi(id),
    enabled: !!id,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFormPayload) => createFormApi(payload),
    onSuccess: (res) => {
      toast.success(`Form "${res.data.name}" created`);
      qc.invalidateQueries({ queryKey: formKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create form"),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFormPayload }) => updateFormApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Form updated");
      qc.invalidateQueries({ queryKey: formKeys.all });
      qc.invalidateQueries({ queryKey: formKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update form"),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFormApi(id),
    onSuccess: () => {
      toast.success("Form deleted");
      qc.invalidateQueries({ queryKey: formKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete form"),
  });
}

export function useDuplicateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateFormApi(id),
    onSuccess: (res) => {
      toast.success(`Form "${res.data.name}" duplicated`);
      qc.invalidateQueries({ queryKey: formKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to duplicate form"),
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePublishApi(id),
    onSuccess: (res) => {
      toast.success(`Form ${res.data.isPublished ? "published" : "unpublished"}`);
      qc.invalidateQueries({ queryKey: formKeys.all });
      qc.invalidateQueries({ queryKey: formKeys.detail(res.data.id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to toggle publish"),
  });
}
