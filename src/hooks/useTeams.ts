import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTeamsApi, getTeamApi, createTeamApi, updateTeamApi, addTeamMemberApi, removeTeamMemberApi,
  type GetTeamsParams, type CreateTeamPayload,
} from "@/api/teams";

export const teamKeys = {
  all: ["teams"] as const,
  list: (params: GetTeamsParams) => ["teams", "list", params] as const,
  detail: (id: string) => ["teams", "detail", id] as const,
};

export function useTeams(params: GetTeamsParams = {}) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => getTeamsApi(params),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => getTeamApi(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeamApi(payload),
    onSuccess: (res) => {
      toast.success(`Team "${res.data.name}" created`);
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create team"),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTeamPayload> }) => updateTeamApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Team updated");
      qc.invalidateQueries({ queryKey: teamKeys.all });
      qc.invalidateQueries({ queryKey: teamKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update team"),
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => addTeamMemberApi(teamId, userId),
    onSuccess: (_, { teamId }) => {
      toast.success("Member added to team");
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to add member"),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => removeTeamMemberApi(teamId, userId),
    onSuccess: (_, { teamId }) => {
      toast.success("Member removed from team");
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove member"),
  });
}
