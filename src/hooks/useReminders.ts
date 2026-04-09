import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getReminderSummaryApi, getRemindersApi, createReminderApi, snoozeReminderApi, completeReminderApi,
  type GetRemindersParams, type CreateReminderPayload,
} from "@/api/reminders";

export const reminderKeys = {
  all: ["reminders"] as const,
  list: (params: GetRemindersParams) => ["reminders", "list", params] as const,
  summary: () => ["reminders", "summary"] as const,
};

export function useReminderSummary() {
  return useQuery({
    queryKey: reminderKeys.summary(),
    queryFn: getReminderSummaryApi,
    staleTime: 30_000,
  });
}

export function useReminders(params: GetRemindersParams = {}) {
  return useQuery({
    queryKey: reminderKeys.list(params),
    queryFn: () => getRemindersApi(params),
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReminderPayload) => createReminderApi(payload),
    onSuccess: () => {
      toast.success("Reminder created");
      qc.invalidateQueries({ queryKey: reminderKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create reminder"),
  });
}

export function useSnoozeReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, snoozeMinutes }: { id: string; snoozeMinutes: number }) =>
      snoozeReminderApi(id, snoozeMinutes),
    onSuccess: () => {
      toast.success("Reminder snoozed");
      qc.invalidateQueries({ queryKey: reminderKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to snooze reminder"),
  });
}

export function useCompleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => completeReminderApi(id, note),
    onSuccess: () => {
      toast.success("Reminder marked complete");
      qc.invalidateQueries({ queryKey: reminderKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to complete reminder"),
  });
}
