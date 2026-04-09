import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { Users, TrendingUp, TrendingDown, Minus, Download, Target, PieChart } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RPieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  useDashboardStats, useLeadsByStatus, useLeadsBySource, useLeadsByPriority,
  useLeadsTrend, useConversionFunnel, useAgentPerformance, useGeoDistribution,
} from "@/hooks/useAnalytics";

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(217, 91%, 60%)",
  contacted: "hsl(38, 92%, 50%)",
  qualified: "hsl(239, 84%, 67%)",
  negotiation: "hsl(25, 95%, 53%)",
  converted: "hsl(160, 84%, 39%)",
  lost: "hsl(0, 72%, 51%)",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(217, 91%, 60%)",
  low: "hsl(220, 9%, 46%)",
};

const FUNNEL_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(239, 84%, 67%)",
  "hsl(25, 95%, 53%)", "hsl(160, 84%, 39%)",
];

function getRateColor(rate: number) {
  if (rate >= 30) return "text-[hsl(var(--success))]";
  if (rate >= 15) return "text-[hsl(var(--warning))]";
  return "text-destructive";
}

function dateRangeParams(range: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (range === "today") {
    return { startDate: fmt(now), endDate: fmt(now) };
  }
  if (range === "7d") {
    const s = new Date(now); s.setDate(now.getDate() - 7);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (range === "this_month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (range === "last_month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: fmt(s), endDate: fmt(e) };
  }
  if (range === "3m") {
    const s = new Date(now); s.setMonth(now.getMonth() - 3);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (range === "year") {
    const s = new Date(now.getFullYear(), 0, 1);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  return {};
}

export default function AnalyticsPage() {
  const [mainTab, setMainTab] = useState("overview");
  const [dateRange, setDateRange] = useState("this_month");

  const { startDate, endDate } = dateRangeParams(dateRange);

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: trendData, isLoading: trendLoading } = useLeadsTrend(startDate, endDate);
  const { data: funnelRaw, isLoading: funnelLoading } = useConversionFunnel();
  const { data: statusRaw, isLoading: statusLoading } = useLeadsByStatus();
  const { data: sourceRaw, isLoading: sourceLoading } = useLeadsBySource();
  const { data: priorityRaw, isLoading: priorityLoading } = useLeadsByPriority();
  const { data: agentRaw, isLoading: agentLoading } = useAgentPerformance();
  const { data: geoRaw, isLoading: geoLoading } = useGeoDistribution(10);

  const stats = statsData?.data;
  const trend = (trendData?.data ?? []).map((t) => ({ date: t.date, created: t.count }));
  const funnelData = (funnelRaw?.data ?? []).map((f, i) => ({ ...f, color: FUNNEL_COLORS[i] ?? "hsl(217, 91%, 60%)" }));
  const statusData = (statusRaw?.data ?? []).map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status.toLowerCase()] ?? "hsl(220, 9%, 46%)",
  }));
  const sourceData = (sourceRaw?.data ?? []).map((s) => ({ source: s.source, count: s.count }));
  const priorityData = (priorityRaw?.data ?? []).map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.priority.toLowerCase()] ?? "hsl(220, 9%, 46%)",
  }));
  const agentData = (agentRaw?.data ?? []).map((a, i) => ({
    rank: i + 1,
    name: a.name,
    created: a.leadsCollected,
    converted: a.leadsConverted,
    rate: Math.round(a.conversionRate),
    activities: a.callsMade ?? 0,
  }));
  const cityData = (geoRaw?.data ?? []).reduce<{ city: string; count: number; pct: number }[]>((acc, g) => {
    const existing = acc.find((x) => x.city === g.city);
    if (existing) { existing.count += g.count; }
    else acc.push({ city: g.city, count: g.count, pct: 0 });
    return acc;
  }, []);
  const totalCities = cityData.reduce((s, c) => s + c.count, 0);
  cityData.forEach((c) => { c.pct = totalCities > 0 ? Math.round((c.count / totalCities) * 100) : 0; });

  const stateData = (geoRaw?.data ?? []).reduce<{ state: string; count: number; pct: number }[]>((acc, g) => {
    const existing = acc.find((x) => x.state === g.state);
    if (existing) { existing.count += g.count; }
    else acc.push({ state: g.state, count: g.count, pct: 0 });
    return acc;
  }, []);
  const totalStates = stateData.reduce((s, c) => s + c.count, 0);
  stateData.forEach((s) => { s.pct = totalStates > 0 ? Math.round((s.count / totalStates) * 100) : 0; });

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Lead Analysis</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <StatCard title="Total Leads" value={stats?.totalLeads?.toLocaleString() ?? "—"} icon={Target} />
              <StatCard title="New Today" value={stats?.newToday?.toLocaleString() ?? "—"} icon={TrendingUp} />
              <StatCard title="Converted" value={stats?.convertedToday?.toLocaleString() ?? "—"} icon={TrendingUp} />
              <StatCard title="Conv. Rate" value={stats ? `${stats.conversionRate.toFixed(1)}%` : "—"} icon={PieChart} />
              <StatCard title="This Month" value={stats?.totalLeadsThisMonth?.toLocaleString() ?? "—"} icon={Users} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Leads Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Area type="monotone" dataKey="created" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.1} strokeWidth={2} name="Created" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                {funnelLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {funnelData.map((stage, i) => {
                      const maxCount = funnelData[0]?.count ?? 1;
                      const pct = Math.round((stage.count / maxCount) * 100);
                      const dropoff = stage.dropoffRate != null ? Math.round(stage.dropoffRate) : 0;
                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{stage.stage}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{stage.count}</span>
                              {i > 0 && dropoff > 0 && <span className="text-xs text-destructive">-{dropoff}%</span>}
                            </div>
                          </div>
                          <div className="h-6 bg-muted rounded-md overflow-hidden">
                            <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Lead Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </span>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
              <CardContent>
                {sourceLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {sourceData.map((s) => (
                      <div key={s.source} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.source}</span>
                        <span className="font-semibold">{s.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lead Analysis */}
        <TabsContent value="leads">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Status</CardTitle></CardHeader>
              <CardContent>
                {statusLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RPieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Source</CardTitle></CardHeader>
              <CardContent>
                {sourceLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="source" type="category" width={110} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Priority</CardTitle></CardHeader>
              <CardContent>
                {priorityLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RPieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Leads Trend</CardTitle></CardHeader>
              <CardContent>
                {trendLoading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Created" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Performance */}
        <TabsContent value="agents">
          {agentLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <>
              {agentData.length >= 3 && (
                <div className="flex items-end justify-center gap-6 mb-8">
                  {[agentData[1], agentData[0], agentData[2]].map((a, i) => {
                    const heights = ["h-24", "h-32", "h-20"];
                    const medals = ["🥈", "🥇", "🥉"];
                    return (
                      <div key={a.rank} className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{medals[i]}</span>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.rate}% conv.</p>
                        <div className={`${heights[i]} w-20 rounded-t-lg bg-primary/10 border border-primary/20 mt-2`} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border rounded-lg mb-6">
                <div className="grid grid-cols-[50px_1fr_70px_70px_60px_70px] gap-3 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                  <span>Rank</span><span>Agent</span><span>Created</span><span>Conv'd</span><span>Rate</span><span>Activities</span>
                </div>
                {agentData.map((a) => (
                  <div key={a.rank} className="grid grid-cols-[50px_1fr_70px_70px_60px_70px] gap-3 px-4 py-2.5 border-b last:border-b-0 text-sm items-center">
                    <span className="font-semibold">{a.rank <= 3 ? ["🥇", "🥈", "🥉"][a.rank - 1] : a.rank}</span>
                    <span className="font-medium">{a.name}</span>
                    <span className="font-semibold">{a.created}</span>
                    <span>{a.converted}</span>
                    <span className={`font-semibold ${getRateColor(a.rate)}`}>{a.rate}%</span>
                    <span>{a.activities}</span>
                  </div>
                ))}
                {agentData.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">No agent data available</div>
                )}
              </div>
            </>
          )}
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export to CSV</Button>
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography">
          {geoLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Top Cities</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cityData.map((g) => (
                        <div key={g.city} className="flex items-center justify-between text-sm">
                          <span className="font-medium w-24">{g.city}</span>
                          <div className="flex-1 mx-3">
                            <div className="h-5 bg-muted rounded overflow-hidden">
                              <div className="h-full bg-primary/80 rounded" style={{ width: `${g.pct}%` }} />
                            </div>
                          </div>
                          <span className="text-muted-foreground w-20 text-right">{g.count} ({g.pct}%)</span>
                        </div>
                      ))}
                      {cityData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Top States</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stateData.map((s) => (
                        <div key={s.state} className="flex items-center justify-between text-sm">
                          <span className="font-medium w-32">{s.state}</span>
                          <div className="flex-1 mx-3">
                            <div className="h-5 bg-muted rounded overflow-hidden">
                              <div className="h-full bg-[hsl(var(--success))]/70 rounded" style={{ width: `${s.pct}%` }} />
                            </div>
                          </div>
                          <span className="text-muted-foreground w-20 text-right">{s.count} ({s.pct}%)</span>
                        </div>
                      ))}
                      {stateData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">City Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={cityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="city" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
