import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getOrganizationApi, updateOrganizationApi, getOrgStatsApi,
  getMeApi, changePasswordApi,
} from "@/api/organization";
import { useAuthStore } from "@/stores/authStore";

export const orgKeys = {
  current: () => ["organization", "current"] as const,
  stats: () => ["organization", "stats"] as const,
  me: () => ["auth", "me"] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: orgKeys.current(),
    queryFn: getOrganizationApi,
    staleTime: 60_000,
  });
}

export function useOrgStats() {
  return useQuery({
    queryKey: orgKeys.stats(),
    queryFn: getOrgStatsApi,
    staleTime: 60_000,
  });
}

export function useMe() {
  return useQuery({
    queryKey: orgKeys.me(),
    queryFn: getMeApi,
    staleTime: 300_000,
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateOrganizationApi>[0]) => updateOrganizationApi(payload),
    onSuccess: () => {
      toast.success("Organization updated");
      qc.invalidateQueries({ queryKey: orgKeys.current() });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update organization"),
  });
}

export function useChangePassword() {
  const { clearAuth } = useAuthStore();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePasswordApi(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed. Please log in again.");
      // Server revokes all refresh tokens — force re-login
      setTimeout(() => clearAuth(), 1500);
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to change password"),
  });
}
