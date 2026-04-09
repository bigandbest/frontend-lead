import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, TrendingUp, Percent, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useDashboardStats, useLeadsByStatus, useLeadsTrend, useTopPerformers } from "@/hooks/useAnalytics";
import { useReminderSummary } from "@/hooks/useReminders";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMyPerformance } from "@/hooks/useTargets";

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(217, 91%, 60%)",
  contacted: "hsl(38, 92%, 50%)",
  qualified: "hsl(239, 84%, 67%)",
  negotiation: "hsl(25, 95%, 53%)",
  converted: "hsl(160, 84%, 39%)",
  lost: "hsl(0, 72%, 51%)",
  invalid: "hsl(220, 9%, 60%)",
  junk: "hsl(220, 9%, 75%)",
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: statusData, isLoading: statusLoading } = useLeadsByStatus();
  const { data: trendData, isLoading: trendLoading } = useLeadsTrend();
  const { data: performersData, isLoading: performersLoading } = useTopPerformers(5);
  const { data: reminderSummary, isLoading: reminderLoading } = useReminderSummary();
  const { data: campaignsData } = useCampaigns({ status: "active", limit: 3 });
  const { data: myPerf } = useMyPerformance();

  const stats = statsData?.data;
  const statusItems = (statusData?.data ?? []).map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "hsl(220, 9%, 60%)",
  }));
  const trendItems = (trendData?.data ?? []).map((t) => ({ date: t.date, created: t.count }));
  const performers = Array.isArray(performersData?.data) ? performersData.data : [];
  const summary = reminderSummary?.data;
  const activeCampaigns = campaignsData?.data ?? [];
  const myTargets = myPerf?.data?.targets ?? [];

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Leads"
              value={stats?.totalLeads?.toLocaleString() ?? "—"}
              trend={stats ? Math.round(((stats.totalLeadsThisMonth - stats.totalLeadsLastMonth) / (stats.totalLeadsLastMonth || 1)) * 100) : 0}
              trendLabel="vs last month"
              icon={Users}
              onClick={() => navigate("/leads")}
            />
            <StatCard
              title="New Today"
              value={stats?.newToday?.toString() ?? "—"}
              icon={UserPlus}
              onClick={() => navigate("/leads")}
            />
            <StatCard
              title="Converted Today"
              value={stats?.convertedToday?.toString() ?? "—"}
              icon={TrendingUp}
              onClick={() => navigate("/leads")}
            />
            <StatCard
              title="Conversion Rate"
              value={stats?.conversionRate !== undefined ? `${stats.conversionRate.toFixed(1)}%` : "—"}
              icon={Percent}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendItems}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Created" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusItems.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Performers</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/analytics")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {performersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : performers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No performance data yet</p>
            ) : (
              <div className="space-y-3">
                {performers.map((p, idx) => (
                  <div key={p.userId} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}.</span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {idx === 0 && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{p.metric?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{p.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-up Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminderLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  onClick={() => navigate("/reminders")}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-sm font-medium">Overdue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-destructive">{summary?.overdue ?? 0}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </button>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-warning/5 hover:bg-warning/10 transition-colors"
                  onClick={() => navigate("/reminders")}
                >
                  <div className="flex items-center gap-3">
                    <span>📅</span>
                    <span className="text-sm font-medium">Due Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-warning">{summary?.dueToday ?? 0}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </button>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-info/5 hover:bg-info/10 transition-colors"
                  onClick={() => navigate("/reminders")}
                >
                  <div className="flex items-center gap-3">
                    <span>📆</span>
                    <span className="text-sm font-medium">Upcoming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-info">{summary?.upcoming ?? 0}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </button>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                  <div className="flex items-center gap-3">
                    <span>✅</span>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="text-sm font-bold text-success">{summary?.completed ?? 0}</span>
                </div>
                {summary?.nextReminder && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Next: "{summary.nextReminder.title}"</p>
                    <p className="text-xs text-muted-foreground">{new Date(summary.nextReminder.reminderAt).toLocaleString()}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* My KPI Targets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Targets — This Month</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/targets")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {myTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No targets assigned</p>
            ) : (
              myTargets.slice(0, 3).map((t) => {
                const pct = Math.min(100, Math.round(t.percentage));
                const barColor = t.status === "achieved" ? "bg-success" : t.status === "behind" ? "bg-destructive" : "bg-warning";
                const label = t.status === "achieved" ? "🟢 Achieved" : t.status === "behind" ? "🔴 Behind" : "🟡 On Track";
                return (
                  <div key={t.targetId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate pr-2">{t.targetName}</span>
                      <span className="font-medium whitespace-nowrap">{t.currentValue} / {t.targetValue} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-xs mt-1 ${t.status === "behind" ? "text-destructive" : t.status === "achieved" ? "text-success" : "text-warning"}`}>
                      {label}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/campaigns")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active campaigns</p>
            ) : (
              activeCampaigns.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate pr-2">{c.name}</p>
                    <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full whitespace-nowrap">Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.leadsCount ?? 0} leads{c.endDate ? ` • Ends ${new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
