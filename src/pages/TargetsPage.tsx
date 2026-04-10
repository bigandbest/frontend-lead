import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Loader2 } from "lucide-react";
import { useTargets, useMyPerformance, useLeaderboard, useCreateTarget, useAssignTarget, useTargetById } from "@/hooks/useTargets";
import { useTeams } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/authStore";

const TARGET_TYPE_MAP: Record<string, { icon: string; label: string }> = {
  leads_collected: { icon: "📋", label: "Leads Collected" },
  leads_converted: { icon: "✅", label: "Leads Converted" },
  calls_made: { icon: "📞", label: "Calls Made" },
  revenue: { icon: "💰", label: "Revenue" },
  visits: { icon: "📍", label: "Visits" },
  follow_ups: { icon: "🔄", label: "Follow-ups" },
};

function getProgressColor(pct: number) {
  if (pct >= 100) return "text-[hsl(var(--success))]";
  if (pct >= 75) return "text-[hsl(var(--warning))]";
  if (pct >= 50) return "text-[hsl(var(--priority-high))]";
  return "text-destructive";
}

function getStatusLabel(pct: number) {
  if (pct >= 100) return { label: "Achieved", color: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" };
  if (pct >= 75) return { label: "On Track", color: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]" };
  if (pct >= 50) return { label: "At Risk", color: "bg-[hsl(var(--priority-high))] text-[hsl(var(--primary-foreground))]" };
  return { label: "Behind", color: "bg-destructive text-destructive-foreground" };
}

function getTrackingStatusClass(status: "on_track" | "behind" | "achieved" | "exceeded") {
  if (status === "achieved" || status === "exceeded") {
    return "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]";
  }
  if (status === "on_track") {
    return "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]";
  }
  return "bg-destructive text-destructive-foreground";
}

function formatStatusLabel(status: "on_track" | "behind" | "achieved" | "exceeded") {
  if (status === "on_track") return "On Track";
  if (status === "achieved") return "Achieved";
  if (status === "exceeded") return "Exceeded";
  return "Behind";
}

export default function TargetsPage() {
  const [mainTab, setMainTab] = useState("targets");
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [activeTargetName, setActiveTargetName] = useState("");
  const [leaderboardType, setLeaderboardType] = useState("leads_collected");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("monthly");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState("");

  const [newForm, setNewForm] = useState({
    name: "", description: "", type: "", period: "", value: "", startDate: "", endDate: "",
  });

  const { data: targetsData, isLoading: targetsLoading } = useTargets({
    search: search || undefined,
    period: periodFilter !== "all" ? periodFilter : undefined,
    limit: 50,
  });
  const { data: performanceData, isLoading: perfLoading } = useMyPerformance();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard(leaderboardType, leaderboardPeriod);
  const { data: teamsData } = useTeams({ limit: 200, isActive: true });
  const { data: usersData } = useUsers({ limit: 200, isActive: true });
  const createTarget = useCreateTarget();
  const assignTarget = useAssignTarget();
  const { data: targetDetailData, isLoading: targetDetailLoading } = useTargetById(activeTargetId ?? undefined);

  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser && ["super_admin", "admin", "marketing_manager", "agent_supervisor"].includes(currentUser.role);

  const targets = targetsData?.data ?? [];
  const performance = performanceData?.data;
  const leaderboard = Array.isArray(leaderboardData?.data) ? leaderboardData.data : [];
  const teams = teamsData?.data ?? [];
  const users = usersData?.data ?? [];
  const targetDetail = targetDetailData?.data;

  const openAssignModal = (targetId: string, targetName: string) => {
    setActiveTargetId(targetId);
    setActiveTargetName(targetName);
    setSelectedTeamIds([]);
    setSelectedUserIds([]);
    setCustomValue("");
    setShowAssignModal(true);
  };

  const openTrackingModal = (targetId: string, targetName: string) => {
    setActiveTargetId(targetId);
    setActiveTargetName(targetName);
    setShowTrackingModal(true);
  };

  const toggleFromList = (items: string[], itemId: string, setter: (next: string[]) => void) => {
    if (items.includes(itemId)) {
      setter(items.filter((id) => id !== itemId));
      return;
    }
    setter([...items, itemId]);
  };

  const handleAssign = () => {
    if (!activeTargetId) return;
    if (selectedTeamIds.length === 0 && selectedUserIds.length === 0) return;

    assignTarget.mutate(
      {
        targetId: activeTargetId,
        teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        customValue: customValue ? Number(customValue) : undefined,
      },
      {
        onSuccess: () => {
          setShowAssignModal(false);
          setShowTrackingModal(true);
        },
      }
    );
  };

  const handleCreate = () => {
    if (!newForm.name || !newForm.type || !newForm.period || !newForm.value || !newForm.startDate || !newForm.endDate) return;
    createTarget.mutate(
      {
        name: newForm.name,
        description: newForm.description || undefined,
        type: newForm.type,
        period: newForm.period,
        value: Number(newForm.value),
        startDate: new Date(newForm.startDate).toISOString(),
        endDate: new Date(newForm.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setNewForm({ name: "", description: "", type: "", period: "", value: "", startDate: "", endDate: "" });
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Targets & KPIs</h1>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Target
          </Button>
        )}
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="performance">My Performance</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Targets List */}
        <TabsContent value="targets">
          <div className="filter-bar">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search targets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No targets found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targets.map((target) => {
                const typeInfo = TARGET_TYPE_MAP[target.type] ?? { icon: "🎯", label: target.type };
                return (
                  <Card key={target.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{target.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {typeInfo.icon} {typeInfo.label} · 📅 {target.period.charAt(0).toUpperCase() + target.period.slice(1)}
                          </p>
                        </div>
                        <Badge
                          variant={target.isActive ? "default" : "secondary"}
                          className={target.isActive ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" : ""}
                        >
                          {target.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>📅 {new Date(target.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – {new Date(target.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p>Target: {target.value.toLocaleString()}</p>
                        <p>Assigned: {target.assignedTeamsCount ?? 0} teams · {target.assignedUsersCount ?? 0} agents</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        {isAdmin && (
                          <Button variant="outline" size="sm" onClick={() => openAssignModal(target.id, target.name)}>Assign</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openTrackingModal(target.id, target.name)}>Track</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Performance */}
        <TabsContent value="performance">
          {perfLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : !performance || performance.targets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No performance data available</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {performance.summary.achieved} achieved · {performance.summary.onTrack} on track · {performance.summary.behind} behind
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performance.targets.map((t) => {
                  const pct = Math.round(t.percentage);
                  const status = getStatusLabel(pct);
                  const typeInfo = TARGET_TYPE_MAP[t.type] ?? { icon: "🎯", label: t.type };
                  return (
                    <Card key={t.targetId}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold">{typeInfo.icon} {t.targetName}</p>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{t.period.charAt(0).toUpperCase() + t.period.slice(1)} Target: {t.targetValue.toLocaleString()}</p>
                        <p className="text-2xl font-bold mb-1">{t.currentValue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mb-2">Remaining: {Math.max(0, t.targetValue - t.currentValue).toLocaleString()}</p>
                        <Progress value={Math.min(pct, 100)} className="h-2 mb-1" />
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <div className="flex items-center gap-3 mb-4">
            <Select value={leaderboardType} onValueChange={setLeaderboardType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leads_collected">Leads Collected</SelectItem>
                <SelectItem value="leads_converted">Leads Converted</SelectItem>
                <SelectItem value="calls_made">Calls Made</SelectItem>
              </SelectContent>
            </Select>
            <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {leaderboardLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No leaderboard data</div>
          ) : (
            <>
              {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8">
                  {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, i) => {
                    const heights = ["h-24", "h-32", "h-20"];
                    const medals = ["🥈", "🥇", "🥉"];
                    return (
                      <div key={user.userId} className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{medals[i]}</span>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(user.percentage)}%</p>
                        <div className={`${heights[i]} w-20 rounded-t-lg bg-primary/10 border border-primary/20 mt-2`} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border rounded-lg">
                <div className="grid grid-cols-[60px_1fr_140px_80px_80px_60px] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                  <span>Rank</span><span>Name</span><span>Team</span><span>Current</span><span>Target</span><span>%</span>
                </div>
                {leaderboard.map((user) => (
                  <div key={user.userId} className="grid grid-cols-[60px_1fr_140px_80px_80px_60px] gap-4 px-4 py-3 border-b last:border-b-0 items-center">
                    <span className="font-semibold">{user.rank <= 3 ? ["🥇", "🥈", "🥉"][user.rank - 1] : user.rank}</span>
                    <span className="font-medium text-sm">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.teamName ?? "—"}</span>
                    <span className="text-sm font-semibold">{user.currentValue}</span>
                    <span className="text-sm text-muted-foreground">{user.targetValue}</span>
                    <span className={`text-sm font-semibold ${getProgressColor(Math.round(user.percentage))}`}>{Math.round(user.percentage)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Target Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Target</DialogTitle>
            <DialogDescription>Define a new KPI target for your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Name *</Label>
              <Input
                placeholder="e.g. Monthly Leads Target"
                className="mt-1"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the target..."
                className="mt-1"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Target Type *</Label>
              <Select value={newForm.type} onValueChange={(v) => setNewForm({ ...newForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads_collected">📋 Leads Collected</SelectItem>
                  <SelectItem value="leads_converted">✅ Leads Converted</SelectItem>
                  <SelectItem value="calls_made">📞 Calls Made</SelectItem>
                  <SelectItem value="revenue">💰 Revenue (₹)</SelectItem>
                  <SelectItem value="visits">📍 Visits</SelectItem>
                  <SelectItem value="follow_ups">🔄 Follow-ups</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period *</Label>
              <div className="flex gap-2 mt-1">
                {(["daily", "weekly", "monthly", "quarterly"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={newForm.period === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewForm({ ...newForm, period: p })}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Target Value *</Label>
              <Input
                type="number"
                placeholder="100"
                className="mt-1"
                value={newForm.value}
                onChange={(e) => setNewForm({ ...newForm, value: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" className="mt-1" value={newForm.startDate} onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" className="mt-1" value={newForm.endDate} onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createTarget.isPending || !newForm.name || !newForm.type || !newForm.period || !newForm.value || !newForm.startDate || !newForm.endDate}
            >
              {createTarget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Target</DialogTitle>
            <DialogDescription>
              Assign {activeTargetName || "this target"} to teams and/or specific agents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Override Target Value (optional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Leave empty to use default"
                className="mt-1"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <p className="font-medium mb-3">Assign To Teams</p>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active teams found</p>
                  ) : (
                    teams.map((team) => (
                      <label key={team.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedTeamIds.includes(team.id)}
                          onCheckedChange={() => toggleFromList(selectedTeamIds, team.id, setSelectedTeamIds)}
                        />
                        <span>{team.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-medium mb-3">Assign To Agents</p>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active agents found</p>
                  ) : (
                    users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => toggleFromList(selectedUserIds, user.id, setSelectedUserIds)}
                        />
                        <span>{user.firstName} {user.lastName}</span>
                        {user.teamName && <span className="text-xs text-muted-foreground">({user.teamName})</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={assignTarget.isPending || !activeTargetId || (selectedTeamIds.length === 0 && selectedUserIds.length === 0)}
            >
              {assignTarget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Target Tracking</DialogTitle>
            <DialogDescription>
              Live assignment tracking for {activeTargetName || "selected target"}.
            </DialogDescription>
          </DialogHeader>

          {targetDetailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : !targetDetail ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No tracking data available.</div>
          ) : (
            <div className="space-y-5 max-h-[70vh] overflow-auto pr-1">
              <div>
                <p className="font-semibold mb-3">Teams</p>
                <div className="space-y-3">
                  {targetDetail.assignedTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team assignments.</p>
                  ) : (
                    targetDetail.assignedTeams.map((team) => (
                      <div key={team.teamId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{team.teamName}</p>
                          <Badge className={getTrackingStatusClass(team.progress?.status ?? "behind")}>
                            {formatStatusLabel(team.progress?.status ?? "behind")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {team.progress?.currentValue ?? 0} / {team.targetValue}
                        </p>
                        <Progress value={Math.min(team.progress?.percentage ?? 0, 100)} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-3">Agents</p>
                <div className="space-y-3">
                  {targetDetail.assignedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No agent assignments.</p>
                  ) : (
                    targetDetail.assignedUsers.map((user) => (
                      <div key={user.userId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-xs text-muted-foreground">{user.teamName ?? "No team"}</p>
                          </div>
                          <Badge className={getTrackingStatusClass(user.progress?.status ?? "behind")}>
                            {formatStatusLabel(user.progress?.status ?? "behind")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {user.progress?.currentValue ?? 0} / {user.targetValue}
                        </p>
                        <Progress value={Math.min(user.progress?.percentage ?? 0, 100)} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
