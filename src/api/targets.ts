import { apiRequest } from "@/lib/apiClient";

export interface Target {
  id: string;
  name: string;
  description?: string;
  type: string;
  period: string;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  assignedTeamsCount?: number;
  assignedUsersCount?: number;
  createdAt: string;
}

export interface TargetTrackingProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
  status: "on_track" | "behind" | "achieved" | "exceeded";
}

export interface AssignedTeamTarget {
  teamId: string;
  teamName: string;
  targetValue: number;
  progress: TargetTrackingProgress | null;
}

export interface AssignedUserTarget {
  userId: string;
  userName: string;
  teamName?: string | null;
  targetValue: number;
  progress: TargetTrackingProgress | null;
}

export interface TargetDetail extends Target {
  assignedTeams: AssignedTeamTarget[];
  assignedUsers: AssignedUserTarget[];
}

export interface UserTargetProgress {
  targetId: string;
  targetName: string;
  type: string;
  period: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  status: "on_track" | "behind" | "achieved" | "failed";
}

export interface UserPerformanceResponse {
  success: boolean;
  data: {
    targets: UserTargetProgress[];
    summary: { achieved: number; onTrack: number; behind: number; total: number };
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  teamName?: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
}

interface RawUserPerformanceTarget {
  targetId: string;
  targetName: string;
  type: string;
  period: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  status: "on_track" | "behind" | "achieved" | "exceeded";
}

interface RawUserPerformanceData {
  userId: string;
  userName: string;
  teamName: string | null;
  targets: RawUserPerformanceTarget[];
  overallPerformance: number;
  rank: number;
}

interface RawLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  teamName: string | null;
  value: number;
  targetValue: number;
  percentage: number;
}

interface RawLeaderboardData {
  period: string;
  type: string;
  entries: RawLeaderboardEntry[];
  updatedAt: string;
}

const toSummary = (targets: UserTargetProgress[]) => {
  const achieved = targets.filter((t) => t.status === "achieved" || t.status === "failed").length;
  const onTrack = targets.filter((t) => t.status === "on_track").length;
  const behind = targets.filter((t) => t.status === "behind").length;

  return {
    achieved,
    onTrack,
    behind,
    total: targets.length,
  };
};

const normalizePerformanceTargets = (rawTargets: RawUserPerformanceTarget[]): UserTargetProgress[] =>
  rawTargets.map((t) => ({
    targetId: t.targetId,
    targetName: t.targetName,
    type: t.type,
    period: t.period,
    targetValue: t.targetValue,
    currentValue: t.currentValue,
    percentage: t.percentage,
    status: t.status === "exceeded" ? "achieved" : t.status,
  }));

export interface CreateTargetPayload {
  name: string;
  description?: string;
  type: string;
  period: string;
  value: number;
  startDate: string;
  endDate: string;
}

export interface GetTargetsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  period?: string;
  isActive?: boolean;
}

export async function getTargetsApi(params: GetTargetsParams = {}): Promise<{
  success: boolean;
  data: Target[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return apiRequest(`/targets?${query}`);
}

export async function getMyPerformanceApi(): Promise<UserPerformanceResponse> {
  const res = await apiRequest<{ success: boolean; data: RawUserPerformanceData }>("/targets/my-performance");
  const targets = normalizePerformanceTargets(res.data?.targets ?? []);

  return {
    success: res.success,
    data: {
      targets,
      summary: toSummary(targets),
    },
  };
}

export async function getUserPerformanceApi(userId: string): Promise<UserPerformanceResponse> {
  const res = await apiRequest<{ success: boolean; data: RawUserPerformanceData }>(`/targets/user/${userId}/performance`);
  const targets = normalizePerformanceTargets(res.data?.targets ?? []);

  return {
    success: res.success,
    data: {
      targets,
      summary: toSummary(targets),
    },
  };
}

export async function getLeaderboardApi(type: string, period: string, teamId?: string): Promise<{
  success: boolean;
  data: LeaderboardEntry[];
}> {
  const query = new URLSearchParams({ type, period });
  if (teamId) query.set("teamId", teamId);
  const res = await apiRequest<{ success: boolean; data: RawLeaderboardData | LeaderboardEntry[] }>(`/targets/leaderboard?${query}`);

  if (Array.isArray(res.data)) {
    return { success: res.success, data: res.data };
  }

  const entries = res.data?.entries ?? [];

  return {
    success: res.success,
    data: entries.map((e) => ({
      rank: e.rank,
      userId: e.userId,
      name: e.userName,
      teamName: e.teamName ?? undefined,
      currentValue: e.value,
      targetValue: e.targetValue,
      percentage: e.percentage,
    })),
  };
}

export async function createTargetApi(payload: CreateTargetPayload): Promise<{ success: boolean; data: Target }> {
  return apiRequest("/targets", { method: "POST", body: payload });
}

export async function getTargetByIdApi(id: string): Promise<{ success: boolean; data: TargetDetail }> {
  return apiRequest(`/targets/${id}`);
}

export async function assignTargetApi(payload: {
  targetId: string;
  teamIds?: string[];
  userIds?: string[];
  customValue?: number;
}): Promise<{ success: boolean; data: TargetDetail }> {
  return apiRequest("/targets/assign", { method: "POST", body: payload });
}
