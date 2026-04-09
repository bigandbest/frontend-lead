import { apiRequest } from "@/lib/apiClient";

export interface DashboardStats {
  totalLeads: number;
  newToday: number;
  convertedToday: number;
  conversionRate: number;
  totalLeadsThisMonth: number;
  totalLeadsLastMonth: number;
}

export interface LeadsByStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface LeadsBySourceItem {
  source: string;
  count: number;
  percentage: number;
}

export interface LeadsTrendItem {
  date: string;
  count: number;
}

export interface ConversionFunnelItem {
  stage: string;
  count: number;
  dropoffRate: number | null;
}

export interface TopPerformerItem {
  userId: string;
  name: string;
  metric: string;
  value: number;
}

interface RawTopPerformerItem {
  userId: string;
  userName: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
}

interface RawTopPerformersResponse {
  success: boolean;
  data:
    | TopPerformerItem[]
    | {
        agents?: RawTopPerformerItem[];
        marketingTeam?: RawTopPerformerItem[];
      };
}

export interface AgentPerformanceItem {
  userId: string;
  name: string;
  leadsCollected: number;
  leadsConverted: number;
  conversionRate: number;
  callsMade?: number;
}

export interface GeoItem {
  city: string;
  state: string;
  count: number;
}

interface RawDashboardStatsResponse {
  success: boolean;
  data: {
    leads: {
      total: number;
      conversionRate: number;
    };
    todayActivity: {
      leadsCreated: number;
      leadsConverted: number;
    };
  };
}

interface RawLeadsTrendItem {
  date: string;
  created: number;
  converted: number;
}

interface RawConversionFunnelItem {
  stage: string;
  count: number;
  dropOff: number;
}

interface RawAgentPerformanceItem {
  userId: string;
  userName: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
  avgResponseTime: number | null;
}

export async function getDashboardStatsApi(): Promise<{ success: boolean; data: DashboardStats }> {
  const res = await apiRequest<RawDashboardStatsResponse>("/analytics/dashboard");

  return {
    success: res.success,
    data: {
      totalLeads: res.data?.leads?.total ?? 0,
      newToday: res.data?.todayActivity?.leadsCreated ?? 0,
      convertedToday: res.data?.todayActivity?.leadsConverted ?? 0,
      conversionRate: res.data?.leads?.conversionRate ?? 0,
      // Backend currently does not return month-over-month counters.
      totalLeadsThisMonth: 0,
      totalLeadsLastMonth: 0,
    },
  };
}

export async function getLeadsByStatusApi(): Promise<{ success: boolean; data: LeadsByStatusItem[] }> {
  return apiRequest("/analytics/leads-by-status");
}

export async function getLeadsBySourceApi(): Promise<{ success: boolean; data: LeadsBySourceItem[] }> {
  return apiRequest("/analytics/leads-by-source");
}

export async function getLeadsByPriorityApi(): Promise<{ success: boolean; data: { priority: string; count: number; percentage: number }[] }> {
  return apiRequest("/analytics/leads-by-priority");
}

export async function getLeadsTrendApi(startDate?: string, endDate?: string): Promise<{ success: boolean; data: LeadsTrendItem[] }> {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  const res = await apiRequest<{ success: boolean; data: RawLeadsTrendItem[] }>(`/analytics/leads-trend?${query}`);

  return {
    success: res.success,
    data: (res.data ?? []).map((item) => ({
      date: item.date,
      count: item.created,
    })),
  };
}

export async function getConversionFunnelApi(): Promise<{ success: boolean; data: ConversionFunnelItem[] }> {
  const res = await apiRequest<{ success: boolean; data: RawConversionFunnelItem[] }>("/analytics/conversion-funnel");

  return {
    success: res.success,
    data: (res.data ?? []).map((item) => ({
      stage: item.stage,
      count: item.count,
      dropoffRate: item.dropOff,
    })),
  };
}

export async function getTopPerformersApi(limit = 5): Promise<{ success: boolean; data: TopPerformerItem[] }> {
  const res = await apiRequest<RawTopPerformersResponse>(`/analytics/top-performers?limit=${limit}`);

  if (Array.isArray(res.data)) {
    return { success: res.success, data: res.data };
  }

  const agents = res.data?.agents ?? [];
  const marketingTeam = res.data?.marketingTeam ?? [];

  const normalized: TopPerformerItem[] = [
    ...agents.map((item) => ({
      userId: item.userId,
      name: item.userName,
      metric: 'leads_created',
      value: item.leadsCreated,
    })),
    ...marketingTeam.map((item) => ({
      userId: item.userId,
      name: item.userName,
      metric: 'leads_converted',
      value: item.leadsConverted,
    })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return { success: res.success, data: normalized };
}

export async function getAgentPerformanceApi(): Promise<{ success: boolean; data: AgentPerformanceItem[] }> {
  const res = await apiRequest<{ success: boolean; data: RawAgentPerformanceItem[] }>("/analytics/agent-performance");

  return {
    success: res.success,
    data: (res.data ?? []).map((item) => ({
      userId: item.userId,
      name: item.userName,
      leadsCollected: item.leadsCreated,
      leadsConverted: item.leadsConverted,
      conversionRate: item.conversionRate,
      callsMade: undefined,
    })),
  };
}

export async function getGeoDistributionApi(limit = 20): Promise<{ success: boolean; data: GeoItem[] }> {
  return apiRequest(`/analytics/geographic-distribution?limit=${limit}`);
}
