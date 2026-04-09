import { apiRequest } from "@/lib/apiClient";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: { latitude: number; longitude: number; address?: string };
  checkOutLocation?: { latitude: number; longitude: number; address?: string };
  status: "present" | "absent" | "half_day" | "leave" | "holiday";
  workHours?: number;
  notes?: string;
}

export interface LeaveBalance {
  sick: { used: number; total: number };
  casual: { used: number; total: number };
  earned: { used: number; total: number };
  unpaid: { used: number };
  maternity?: { used: number; total: number };
  paternity?: { used: number; total: number };
  bereavement?: { used: number; total: number };
}

export interface CheckInPayload {
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export interface LeaveRequestPayload {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function checkInApi(payload: CheckInPayload): Promise<{ success: boolean; data: AttendanceRecord }> {
  return apiRequest("/attendance/check-in", { method: "POST", body: payload });
}

export async function checkOutApi(payload: CheckInPayload): Promise<{ success: boolean; data: AttendanceRecord }> {
  return apiRequest("/attendance/check-out", { method: "POST", body: payload });
}

export async function getTodayAttendanceApi(): Promise<{ success: boolean; data: AttendanceRecord | null }> {
  return apiRequest("/attendance/today");
}

export async function getAttendanceHistoryApi(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string; userId?: string } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest<{ success: boolean; data: AttendanceRecord[]; pagination: unknown }>(`/attendance?${query}`);
}

export async function getLeaveBalanceApi(): Promise<{ success: boolean; data: LeaveBalance }> {
  return apiRequest("/attendance/leave/balance");
}

export async function requestLeaveApi(payload: LeaveRequestPayload): Promise<{ success: boolean }> {
  return apiRequest("/attendance/leave", { method: "POST", body: payload });
}

export async function reviewLeaveApi(id: string, status: "approved" | "rejected", note?: string): Promise<{ success: boolean }> {
  return apiRequest(`/attendance/leave/${id}/review`, { method: "POST", body: { status, note } });
}
