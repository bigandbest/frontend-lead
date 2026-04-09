import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  checkInApi, checkOutApi, getTodayAttendanceApi, getAttendanceHistoryApi,
  getLeaveBalanceApi, requestLeaveApi, reviewLeaveApi,
  type CheckInPayload, type LeaveRequestPayload,
} from "@/api/attendance";

export const attendanceKeys = {
  all: ["attendance"] as const,
  today: () => ["attendance", "today"] as const,
  history: (params: object) => ["attendance", "history", params] as const,
  leaveBalance: () => ["attendance", "leave-balance"] as const,
};

export function useTodayAttendance() {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: getTodayAttendanceApi,
    staleTime: 30_000,
  });
}

export function useAttendanceHistory(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: attendanceKeys.history(params),
    queryFn: () => getAttendanceHistoryApi(params),
  });
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: attendanceKeys.leaveBalance(),
    queryFn: getLeaveBalanceApi,
    staleTime: 60_000,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInPayload) => checkInApi(payload),
    onSuccess: () => {
      toast.success("Checked in successfully");
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Check-in failed"),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInPayload) => checkOutApi(payload),
    onSuccess: () => {
      toast.success("Checked out successfully");
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Check-out failed"),
  });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveRequestPayload) => requestLeaveApi(payload),
    onSuccess: () => {
      toast.success("Leave request submitted");
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to submit leave request"),
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "approved" | "rejected"; note?: string }) =>
      reviewLeaveApi(id, status, note),
    onSuccess: (_, { status }) => {
      toast.success(`Leave ${status}`);
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed"),
  });
}
