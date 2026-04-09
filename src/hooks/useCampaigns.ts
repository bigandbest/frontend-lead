import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCampaignsApi, getCampaignApi, getCampaignStatsApi, createCampaignApi,
  updateCampaignApi, updateCampaignStatusApi, duplicateCampaignApi,
  getCampaignLeadsApi, addLeadsToCampaignApi, removeLeadsFromCampaignApi,
  assignTeamsApi, removeTeamsApi, assignUsersApi, removeUsersApi,
  type GetCampaignsParams, type CreateCampaignPayload, type UpdateCampaignPayload,
} from "@/api/campaigns";

export const campaignKeys = {
  all: ["campaigns"] as const,
  list: (params: GetCampaignsParams) => ["campaigns", "list", params] as const,
  detail: (id: string) => ["campaigns", "detail", id] as const,
  stats: (id: string) => ["campaigns", "stats", id] as const,
  leads: (id: string, params: object) => ["campaigns", "leads", id, params] as const,
};

export function useCampaigns(params: GetCampaignsParams = {}) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => getCampaignsApi(params),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaignApi(id),
    enabled: !!id,
  });
}

export function useCampaignStats(id: string) {
  return useQuery({
    queryKey: campaignKeys.stats(id),
    queryFn: () => getCampaignStatsApi(id),
    enabled: !!id,
  });
}

export function useCampaignLeads(id: string, params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: campaignKeys.leads(id, params),
    queryFn: () => getCampaignLeadsApi(id, params),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaignApi(payload),
    onSuccess: (res) => {
      toast.success(`Campaign "${res.data.name}" created`);
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create campaign"),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCampaignPayload }) =>
      updateCampaignApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Campaign updated");
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update campaign"),
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateCampaignStatusApi(id, status, reason),
    onSuccess: (_, { id, status }) => {
      toast.success(`Campaign ${status}`);
      qc.invalidateQueries({ queryKey: campaignKeys.all });
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update campaign status"),
  });
}

export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateCampaignApi(id),
    onSuccess: (res) => {
      toast.success(`Campaign duplicated as "${res.data.name}"`);
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to duplicate campaign"),
  });
}

export function useAddLeadsToCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, leadIds }: { id: string; leadIds: string[] }) =>
      addLeadsToCampaignApi(id, leadIds),
    onSuccess: (_, { id }) => {
      toast.success("Leads added to campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.leads(id, {}) });
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to add leads"),
  });
}

export function useRemoveLeadsFromCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, leadIds }: { id: string; leadIds: string[] }) =>
      removeLeadsFromCampaignApi(id, leadIds),
    onSuccess: (_, { id }) => {
      toast.success("Lead removed from campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.leads(id, {}) });
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove lead"),
  });
}

export function useAssignCampaignTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teamIds }: { id: string; teamIds: string[] }) =>
      assignTeamsApi(id, teamIds),
    onSuccess: (_, { id }) => {
      toast.success("Teams assigned to campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign teams"),
  });
}

export function useRemoveCampaignTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teamId }: { id: string; teamId: string }) =>
      removeTeamsApi(id, [teamId]),
    onSuccess: (_, { id }) => {
      toast.success("Team removed from campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove team"),
  });
}

export function useAssignCampaignUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      assignUsersApi(id, userIds),
    onSuccess: (_, { id }) => {
      toast.success("Users assigned to campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign users"),
  });
}

export function useRemoveCampaignUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      removeUsersApi(id, [userId]),
    onSuccess: (_, { id }) => {
      toast.success("User removed from campaign");
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove user"),
  });
}
