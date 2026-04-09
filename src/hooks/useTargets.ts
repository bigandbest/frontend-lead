import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTargetsApi, getMyPerformanceApi, getLeaderboardApi, createTargetApi, assignTargetApi, getTargetByIdApi,
  type GetTargetsParams, type CreateTargetPayload,
} from "@/api/targets";

export const targetKeys = {
  all: ["targets"] as const,
  list: (params: GetTargetsParams) => ["targets", "list", params] as const,
  detail: (id: string) => ["targets", "detail", id] as const,
  myPerformance: () => ["targets", "my-performance"] as const,
  leaderboard: (type: string, period: string, teamId?: string) => ["targets", "leaderboard", type, period, teamId] as const,
};

export function useTargets(params: GetTargetsParams = {}) {
  return useQuery({
    queryKey: targetKeys.list(params),
    queryFn: () => getTargetsApi(params),
  });
}

export function useMyPerformance() {
  return useQuery({
    queryKey: targetKeys.myPerformance(),
    queryFn: getMyPerformanceApi,
    staleTime: 30_000,
  });
}

export function useTargetById(id?: string) {
  return useQuery({
    queryKey: targetKeys.detail(id ?? ""),
    queryFn: () => getTargetByIdApi(id as string),
    enabled: Boolean(id),
  });
}

export function useLeaderboard(type: string, period: string, teamId?: string) {
  return useQuery({
    queryKey: targetKeys.leaderboard(type, period, teamId),
    queryFn: () => getLeaderboardApi(type, period, teamId),
    enabled: !!(type && period),
  });
}

export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTargetPayload) => createTargetApi(payload),
    onSuccess: () => {
      toast.success("Target created");
      qc.invalidateQueries({ queryKey: targetKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create target"),
  });
}

export function useAssignTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof assignTargetApi>[0]) => assignTargetApi(payload),
    onSuccess: (_, variables) => {
      toast.success("Target assigned");
      qc.invalidateQueries({ queryKey: targetKeys.all });
      if (variables.targetId) {
        qc.invalidateQueries({ queryKey: targetKeys.detail(variables.targetId) });
      }
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign target"),
  });
}
