import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getLeadsApi, getLeadApi, getLeadStatsApi, createLeadApi, updateLeadApi, deleteLeadApi,
  bulkAssignLeadsApi, bulkUpdateLeadStatusApi, getLeadActivitiesApi, addLeadActivityApi, getAllLeadsForExportApi,
  type GetLeadsParams, type CreateLeadPayload, type UpdateLeadPayload,
} from "@/api/leads";
import { exportLeadsToExcel } from "@/utils/excel-export";

export const leadKeys = {
  all: ["leads"] as const,
  list: (params: GetLeadsParams) => ["leads", "list", params] as const,
  detail: (id: string) => ["leads", "detail", id] as const,
  stats: () => ["leads", "stats"] as const,
  activities: (id: string) => ["leads", "activities", id] as const,
};

export function useLeads(params: GetLeadsParams = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => getLeadsApi(params),
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: getLeadStatsApi,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLeadApi(id),
    enabled: !!id,
  });
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: leadKeys.activities(leadId),
    queryFn: () => getLeadActivitiesApi(leadId),
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLeadApi(payload),
    onSuccess: () => {
      toast.success("Lead created");
      qc.invalidateQueries({ queryKey: leadKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create lead"),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) => updateLeadApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: leadKeys.all });
      qc.invalidateQueries({ queryKey: leadKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leadKeys.stats() });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update lead"),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeadApi(id),
    onSuccess: () => {
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: leadKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete lead"),
  });
}

export function useBulkAssignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadIds, assignedToId }: { leadIds: string[]; assignedToId: string }) =>
      bulkAssignLeadsApi(leadIds, assignedToId),
    onSuccess: () => {
      toast.success("Leads assigned successfully");
      qc.invalidateQueries({ queryKey: leadKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign leads"),
  });
}

export function useBulkUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadIds, status }: { leadIds: string[]; status: string }) =>
      bulkUpdateLeadStatusApi(leadIds, status),
    onSuccess: () => {
      toast.success("Lead statuses updated");
      qc.invalidateQueries({ queryKey: leadKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update status"),
  });
}

export function useAddLeadActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: { type: string; title: string; description?: string } }) =>
      addLeadActivityApi(leadId, payload),
    onSuccess: (_, { leadId }) => {
      toast.success("Activity logged");
      qc.invalidateQueries({ queryKey: leadKeys.activities(leadId) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to log activity"),
  });
}

export function useExportLeads() {
  return useMutation({
    mutationFn: async (params: GetLeadsParams = {}) => {
      const response = await getAllLeadsForExportApi(params);
      if (!response.success || !response.data.length) {
        throw new Error("No leads to export");
      }
      const filename = `leads_${new Date().toISOString().split("T")[0]}.xlsx`;
      exportLeadsToExcel(response.data, filename);
      return response;
    },
    onSuccess: () => {
      toast.success("Leads exported successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to export leads");
    },
  });
}
