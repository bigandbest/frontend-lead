import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStatsApi, getLeadsByStatusApi, getLeadsBySourceApi, getLeadsByPriorityApi,
  getLeadsTrendApi, getConversionFunnelApi, getTopPerformersApi, getAgentPerformanceApi, getGeoDistributionApi,
} from "@/api/analytics";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getDashboardStatsApi,
    staleTime: 60_000,
  });
}

export function useLeadsByStatus() {
  return useQuery({
    queryKey: ["analytics", "leads-by-status"],
    queryFn: getLeadsByStatusApi,
    staleTime: 60_000,
  });
}

export function useLeadsBySource() {
  return useQuery({
    queryKey: ["analytics", "leads-by-source"],
    queryFn: getLeadsBySourceApi,
    staleTime: 60_000,
  });
}

export function useLeadsByPriority() {
  return useQuery({
    queryKey: ["analytics", "leads-by-priority"],
    queryFn: getLeadsByPriorityApi,
    staleTime: 60_000,
  });
}

export function useLeadsTrend(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["analytics", "leads-trend", startDate, endDate],
    queryFn: () => getLeadsTrendApi(startDate, endDate),
    staleTime: 60_000,
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ["analytics", "conversion-funnel"],
    queryFn: getConversionFunnelApi,
    staleTime: 60_000,
  });
}

export function useTopPerformers(limit = 5) {
  return useQuery({
    queryKey: ["analytics", "top-performers", limit],
    queryFn: () => getTopPerformersApi(limit),
    staleTime: 60_000,
  });
}

export function useAgentPerformance() {
  return useQuery({
    queryKey: ["analytics", "agent-performance"],
    queryFn: getAgentPerformanceApi,
    staleTime: 60_000,
  });
}

export function useGeoDistribution(limit = 20) {
  return useQuery({
    queryKey: ["analytics", "geo-distribution", limit],
    queryFn: () => getGeoDistributionApi(limit),
    staleTime: 60_000,
  });
}
