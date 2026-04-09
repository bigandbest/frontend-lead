import { apiRequest } from "@/lib/apiClient";

export interface Reminder {
  id: string;
  leadId: string;
  leadName?: string;
  leadPhone?: string;
  leadStatus?: string;
  title: string;
  description?: string;
  reminderAt: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed" | "snoozed" | "cancelled";
  recurrence?: string;
  notifyChannels?: string[];
  snoozedUntil?: string;
  completedAt?: string;
  completionNote?: string;
  createdAt: string;
}

export interface ReminderSummary {
  overdue: number;
  dueToday: number;
  upcoming: number;
  completed: number;
  nextReminder?: { id: string; title: string; reminderAt: string };
}

export interface CreateReminderPayload {
  leadId: string;
  title: string;
  description?: string;
  reminderAt: string;
  priority?: "low" | "medium" | "high";
  recurrence?: string;
  notifyChannels?: string[];
}

export interface GetRemindersParams {
  page?: number;
  limit?: number;
  leadId?: string;
  status?: string;
  priority?: string;
  isOverdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export async function getReminderSummaryApi(): Promise<{ success: boolean; data: ReminderSummary }> {
  return apiRequest("/reminders/summary");
}

export async function getRemindersApi(params: GetRemindersParams = {}): Promise<{
  success: boolean;
  message?: string;
  data: Reminder[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest(`/reminders?${query}`);
}

export async function createReminderApi(payload: CreateReminderPayload): Promise<{ success: boolean; data: Reminder }> {
  return apiRequest("/reminders", { method: "POST", body: payload });
}

export async function snoozeReminderApi(id: string, snoozeMinutes: number): Promise<{ success: boolean }> {
  return apiRequest(`/reminders/${id}/snooze`, { method: "POST", body: { snoozeMinutes } });
}

export async function completeReminderApi(id: string, note?: string): Promise<{ success: boolean }> {
  return apiRequest(`/reminders/${id}/complete`, { method: "POST", body: { note } });
}
