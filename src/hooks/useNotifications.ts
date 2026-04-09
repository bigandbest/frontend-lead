import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationsApi, getUnreadCountApi, markNotificationReadApi,
  markAllNotificationsReadApi, deleteReadNotificationsApi,
  type GetNotificationsParams,
} from "@/api/notifications";
import { useAuthStore } from "@/stores/authStore";

export const notifKeys = {
  all: ["notifications"] as const,
  list: (params: GetNotificationsParams) => ["notifications", "list", params] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useNotifications(params: GetNotificationsParams = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: notifKeys.list(params),
    queryFn: () => getNotificationsApi(params),
    enabled: isAuthenticated,
  });
}

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: notifKeys.unreadCount(),
    queryFn: getUnreadCountApi,
    enabled: isAuthenticated,
    refetchInterval: 30_000, // poll every 30s
    staleTime: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: notifKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed"),
  });
}

export function useDeleteReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReadNotificationsApi,
    onSuccess: () => {
      toast.success("Read notifications deleted");
      qc.invalidateQueries({ queryKey: notifKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete"),
  });
}
