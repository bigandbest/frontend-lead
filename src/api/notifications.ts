import { apiRequest } from "@/lib/apiClient";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionLink?: string;
  actionLabel?: string;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export async function getNotificationsApi(params: GetNotificationsParams = {}): Promise<{
  success: boolean;
  data: Notification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest(`/notifications?${query}`);
}

export async function getUnreadCountApi(): Promise<{ success: boolean; data: { count: number } }> {
  return apiRequest("/notifications/unread-count");
}

export async function markNotificationReadApi(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsReadApi(): Promise<{ success: boolean }> {
  return apiRequest("/notifications/read-all", { method: "POST" });
}

export async function deleteReadNotificationsApi(): Promise<{ success: boolean }> {
  return apiRequest("/notifications/delete-read", { method: "DELETE" });
}
