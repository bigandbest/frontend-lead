import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, MoreVertical, Pencil, Play, Pause, CheckCircle,
  XCircle, FileText, CalendarDays, IndianRupee, Phone,
  Mail, MessageSquare, Handshake, Plus, Search, Trash2, Copy,
  Eye, UserPlus, Target, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCampaign, useCampaignLeads, useUpdateCampaign, useUpdateCampaignStatus,
  useDuplicateCampaign, useAssignCampaignTeams, useRemoveCampaignTeam,
  useAssignCampaignUsers, useRemoveCampaignUser, useAddLeadsToCampaign,
  useRemoveLeadsFromCampaign,
} from "@/hooks/useCampaigns";
import { useTeams } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { useLeads } from "@/hooks/useLeads";

const campaignStatusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  active: { color: "bg-success/15 text-success", label: "Active" },
  paused: { color: "bg-warning/15 text-warning", label: "Paused" },
  completed: { color: "bg-primary/15 text-primary", label: "Completed" },
  cancelled: { color: "bg-destructive/15 text-destructive", label: "Cancelled" },
};

const campaignTypeIcons: Record<string, { icon: React.ElementType; label: string }> = {
  field_collection: { icon: Handshake, label: "Field Collection" },
  field: { icon: Handshake, label: "Field Collection" },
  telecalling: { icon: Phone, label: "Telecalling" },
  email: { icon: Mail, label: "Email" },
  sms: { icon: MessageSquare, label: "SMS" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp" },
  mixed: { icon: Target, label: "Mixed" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toDateInput(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  // Leads tab state
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSearchInput, setLeadSearchInput] = useState("");
  const [leadStatus, setLeadStatus] = useState("all");
  const [leadPage, setLeadPage] = useState(1);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Selection state for modals
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [teamModalSearch, setTeamModalSearch] = useState("");
  const [userModalSearch, setUserModalSearch] = useState("");
  const [leadModalSearch, setLeadModalSearch] = useState("");

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: "", description: "", startDate: "", endDate: "", budget: "",
  });

  // Edit modal form state
  const [editForm, setEditForm] = useState({
    name: "", description: "", budget: "",
  });

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: campaignRes, isLoading } = useCampaign(id!);
  const campaign = campaignRes?.data;

  const { data: leadsRes, isLoading: leadsLoading } = useCampaignLeads(id!, {
    page: leadPage,
    limit: 10,
    search: leadSearch || undefined,
    status: leadStatus !== "all" ? leadStatus : undefined,
  });

  const { data: teamsRes } = useTeams({ search: teamModalSearch || undefined, limit: 50 });
  const { data: usersRes } = useUsers({ search: userModalSearch || undefined, limit: 50 });
  const { data: allLeadsRes } = useLeads({
    search: leadModalSearch || undefined,
    limit: 20,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const updateStatus = useUpdateCampaignStatus();
  const updateCampaign = useUpdateCampaign();
  const duplicate = useDuplicateCampaign();
  const assignTeams = useAssignCampaignTeams();
  const removeTeam = useRemoveCampaignTeam();
  const assignUsers = useAssignCampaignUsers();
  const removeUser = useRemoveCampaignUser();
  const addLeads = useAddLeadsToCampaign();
  const removeLeads = useRemoveLeadsFromCampaign();

  // ─── Init forms from campaign data ────────────────────────────────────────
  useEffect(() => {
    if (campaign) {
      setSettingsForm({
        name: campaign.name,
        description: campaign.description ?? "",
        startDate: toDateInput(campaign.startDate),
        endDate: toDateInput(campaign.endDate),
        budget: campaign.budget != null ? String(campaign.budget) : "",
      });
    }
  }, [campaign?.id]);

  // ─── Loading / Not found ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading campaign...
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-muted-foreground">Campaign not found.</p>
          <Button variant="outline" onClick={() => navigate("/campaigns")}>Back to Campaigns</Button>
        </div>
      </AppLayout>
    );
  }

  // ─── Computed values ──────────────────────────────────────────────────────
  const TypeIcon = campaignTypeIcons[campaign.type]?.icon ?? FileText;
  const typeLabel = campaignTypeIcons[campaign.type]?.label ?? campaign.type;
  const statusCfg = campaignStatusConfig[campaign.status] ?? campaignStatusConfig.draft;

  const stats = campaign.stats;
  const totalLeads = stats?.totalLeads ?? 0;
  const leadsByStatus = stats?.leadsByStatus ?? {};
  const conversionRate = stats?.conversionRate ?? 0;
  const convertedLeads = leadsByStatus["converted"] ?? 0;
  const maxTarget = campaign.settings?.maxLeadsTotal ?? null;

  // Time progress
  const now = new Date();
  const start = campaign.startDate ? new Date(campaign.startDate) : null;
  const end = campaign.endDate ? new Date(campaign.endDate) : null;
  let daysTotal = 0, daysPassed = 0, timeProgress = 0;
  if (start && end) {
    daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    daysPassed = Math.min(Math.max(0, Math.ceil((now.getTime() - start.getTime()) / 86400000)), daysTotal);
    timeProgress = Math.round((daysPassed / daysTotal) * 100);
  }

  // Teams / users already assigned
  const assignedTeams = campaign.assignedTeams ?? [];
  const assignedUsers = campaign.assignedUsers ?? [];
  const assignedTeamIds = new Set(assignedTeams.map((t) => t.teamId));
  const assignedUserIds = new Set(assignedUsers.map((u) => u.userId));

  // Leads pagination
  const leadsPagination = leadsRes?.pagination;
  const leads = leadsRes?.data ?? [];

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleStatusChange = (status: string, reason?: string) => {
    updateStatus.mutate({ id: id!, status, reason });
    if (status === "cancelled") setShowCancelConfirm(false);
  };

  const handleSaveSettings = () => {
    updateCampaign.mutate({
      id: id!,
      payload: {
        name: settingsForm.name || undefined,
        description: settingsForm.description || undefined,
        startDate: settingsForm.startDate || undefined,
        endDate: settingsForm.endDate || undefined,
        budget: settingsForm.budget ? Number(settingsForm.budget) : undefined,
      },
    });
  };

  const handleOpenEdit = () => {
    setEditForm({
      name: campaign.name,
      description: campaign.description ?? "",
      budget: campaign.budget != null ? String(campaign.budget) : "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    updateCampaign.mutate(
      { id: id!, payload: { name: editForm.name, description: editForm.description || undefined, budget: editForm.budget ? Number(editForm.budget) : undefined } },
      { onSuccess: () => setShowEditModal(false) }
    );
  };

  const handleAddTeams = () => {
    if (!selectedTeamIds.length) return;
    assignTeams.mutate(
      { id: id!, teamIds: selectedTeamIds },
      { onSuccess: () => { setShowAddTeamModal(false); setSelectedTeamIds([]); setTeamModalSearch(""); } }
    );
  };

  const handleAddUsers = () => {
    if (!selectedUserIds.length) return;
    assignUsers.mutate(
      { id: id!, userIds: selectedUserIds },
      { onSuccess: () => { setShowAddUserModal(false); setSelectedUserIds([]); setUserModalSearch(""); } }
    );
  };

  const handleAddLeads = () => {
    if (!selectedLeadIds.length) return;
    addLeads.mutate(
      { id: id!, leadIds: selectedLeadIds },
      { onSuccess: () => { setShowAddLeadModal(false); setSelectedLeadIds([]); setLeadModalSearch(""); } }
    );
  };

  const handleLeadSearch = () => {
    setLeadSearch(leadSearchInput);
    setLeadPage(1);
  };

  // Filter available teams/users (not already assigned)
  const availableTeams = (teamsRes?.data ?? []).filter((t) => !assignedTeamIds.has(t.id));
  const availableUsers = (usersRes?.data ?? []).filter((u) => !assignedUserIds.has(u.id));
  const availableLeads = (allLeadsRes?.data ?? []).filter((l) => !selectedLeadIds.includes(l.id));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <TypeIcon className="h-4 w-4" />
                <span>{typeLabel}</span>
                {(campaign.startDate || campaign.endDate) && (
                  <>
                    <span>·</span>
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === "active" && (
              <Button
                variant="outline" size="sm"
                onClick={() => handleStatusChange("paused")}
                disabled={updateStatus.isPending}
              >
                <Pause className="h-4 w-4 mr-1" /> Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button
                variant="outline" size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={updateStatus.isPending}
              >
                <Play className="h-4 w-4 mr-1" /> Resume
              </Button>
            )}
            {campaign.status === "draft" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={updateStatus.isPending}
              >
                <Play className="h-4 w-4 mr-1" /> Activate
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenEdit}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicate.mutate(id!)} disabled={duplicate.isPending}>
                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {campaign.status !== "completed" && campaign.status !== "cancelled" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
                  </DropdownMenuItem>
                )}
                {campaign.status !== "cancelled" && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowCancelConfirm(true)}>
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Campaign
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads ({totalLeads})</TabsTrigger>
            <TabsTrigger value="teams">Teams & Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ───────────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Leads", value: totalLeads, icon: FileText },
                  { label: "Converted", value: convertedLeads, icon: CheckCircle },
                  { label: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, icon: Target },
                  {
                    label: "Budget",
                    value: campaign.budget != null ? `₹${(campaign.budget / 1000).toFixed(0)}K` : "—",
                    icon: IndianRupee,
                  },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Campaign Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {start && end ? (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Time Progress</span>
                          <span className="font-medium text-foreground">{timeProgress}%</span>
                        </div>
                        <Progress value={timeProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Day {daysPassed} of {daysTotal}
                          {stats?.daysRemaining != null && ` · ${stats.daysRemaining} days remaining`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No date range set</p>
                    )}

                    {maxTarget && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Lead Target</span>
                          <span className="font-medium text-foreground">{totalLeads} / {maxTarget}</span>
                        </div>
                        <Progress value={Math.min((totalLeads / maxTarget) * 100, 100)} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{campaign.assignedTeamsCount ?? assignedTeams.length}</p>
                        <p className="text-xs text-muted-foreground">Teams</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{campaign.assignedUsersCount ?? assignedUsers.length}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{stats?.leadsToday ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campaign.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm text-foreground">{campaign.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium text-foreground">{formatDate(campaign.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="text-sm font-medium text-foreground">{formatDate(campaign.endDate)}</p>
                      </div>
                      {campaign.budget != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium text-foreground">₹{campaign.budget.toLocaleString("en-IN")}</p>
                        </div>
                      )}
                      {stats?.budgetSpent != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Budget Spent</p>
                          <p className="text-sm font-medium text-foreground">₹{stats.budgetSpent.toLocaleString("en-IN")}</p>
                        </div>
                      )}
                    </div>
                    {campaign.formName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Linked Form</p>
                        <Badge variant="secondary" className="text-xs mt-1">{campaign.formName}</Badge>
                      </div>
                    )}
                    {stats?.topPerformer && (
                      <div>
                        <p className="text-xs text-muted-foreground">Top Performer</p>
                        <p className="text-sm font-medium text-foreground">
                          {stats.topPerformer.userName} · {stats.topPerformer.leadsCount} leads
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lead Status Breakdown */}
              {Object.keys(leadsByStatus).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lead Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {Object.entries(leadsByStatus).map(([status, count]) => (
                        <div key={status} className="text-center p-3 rounded-lg border">
                          <p className="text-2xl font-bold text-foreground">{count}</p>
                          <StatusBadge status={status} size="sm" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Leads Today</p>
                      <p className="text-xl font-bold text-foreground">{stats.leadsToday}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">This Week</p>
                      <p className="text-xl font-bold text-foreground">{stats.leadsThisWeek}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg / Day</p>
                      <p className="text-xl font-bold text-foreground">{stats.avgLeadsPerDay?.toFixed(1) ?? "—"}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Calls</p>
                      <p className="text-xl font-bold text-foreground">{stats.totalCallsMade ?? 0}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Leads Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="leads">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={leadSearchInput}
                        onChange={(e) => setLeadSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLeadSearch()}
                        className="pl-9 w-56"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLeadSearch}>Search</Button>
                  </div>
                  <div className="flex gap-2">
                    <Select value={leadStatus} onValueChange={(v) => { setLeadStatus(v); setLeadPage(1); }}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => setShowAddLeadModal(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Lead
                    </Button>
                  </div>
                </div>

                {leadsLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading leads...
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No leads in this campaign yet. Click "Add Lead" to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">
                            {lead.firstName} {lead.lastName ?? ""}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                          <TableCell><StatusBadge status={lead.status} size="sm" /></TableCell>
                          <TableCell><PriorityBadge priority={lead.priority} size="sm" /></TableCell>
                          <TableCell className="text-muted-foreground">{lead.assignedToName ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}>
                                  <Eye className="h-4 w-4 mr-2" /> View Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); removeLeads.mutate({ id: id!, leadIds: [lead.id] }); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Remove from Campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {leadsPagination && leadsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>
                      Showing {(leadPage - 1) * 10 + 1}–{Math.min(leadPage * 10, leadsPagination.total)} of {leadsPagination.total}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        disabled={leadPage <= 1}
                        onClick={() => setLeadPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={leadPage >= leadsPagination.totalPages}
                        onClick={() => setLeadPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Teams & Users Tab ─────────────────────────────────────────── */}
          <TabsContent value="teams">
            <div className="space-y-6">
              {/* Teams */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Assigned Teams ({assignedTeams.length})
                    </CardTitle>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => { setTeamModalSearch(""); setSelectedTeamIds([]); setShowAddTeamModal(true); }}
                      disabled={campaign.status === "cancelled"}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Team
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignedTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No teams assigned yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedTeams.map((team) => (
                          <TableRow key={team.teamId}>
                            <TableCell className="font-medium text-foreground">{team.teamName}</TableCell>
                            <TableCell className="text-muted-foreground">{team.membersCount}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                onClick={() => removeTeam.mutate({ id: id!, teamId: team.teamId })}
                                disabled={removeTeam.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Users */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Assigned Users ({assignedUsers.length})
                    </CardTitle>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => { setUserModalSearch(""); setSelectedUserIds([]); setShowAddUserModal(true); }}
                      disabled={campaign.status === "cancelled"}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No users assigned yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedUsers.map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {user.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{user.userName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{user.role}</TableCell>
                            <TableCell className="text-muted-foreground">{user.teamName ?? "—"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                onClick={() => removeUser.mutate({ id: id!, userId: user.userId })}
                                disabled={removeUser.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Settings Tab ──────────────────────────────────────────────── */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Campaign Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={settingsForm.startDate}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={settingsForm.endDate}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget (₹)</Label>
                    <Input
                      type="number"
                      value={settingsForm.budget}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, budget: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateCampaign.isPending}
                  >
                    {updateCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Campaign Behaviour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Auto-assign leads</span>
                    <span className="font-medium text-foreground">
                      {campaign.settings?.autoAssign ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {campaign.settings?.autoAssign && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Assignment strategy</span>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {campaign.settings.autoAssignStrategy ?? "manual"}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Require geolocation</span>
                    <span className="font-medium text-foreground">
                      {campaign.settings?.requireGeolocation ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Form required</span>
                    <span className="font-medium text-foreground">
                      {campaign.settings?.formRequired ? "Yes" : "No"}
                    </span>
                  </div>
                  {campaign.settings?.dailyLeadTarget && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Daily lead target</span>
                      <span className="font-medium text-foreground">{campaign.settings.dailyLeadTarget}</span>
                    </div>
                  )}
                  {campaign.settings?.maxLeadsTotal && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Max leads total</span>
                      <span className="font-medium text-foreground">{campaign.settings.maxLeadsTotal}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              {campaign.status !== "cancelled" && (
                <Card className="border-destructive/30 md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Cancel Campaign</p>
                      <p className="text-sm text-muted-foreground">
                        This will permanently cancel the campaign. Leads will be retained.
                      </p>
                    </div>
                    <Button
                      variant="destructive" size="sm"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      Cancel Campaign
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Campaign Modal ──────────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Budget (₹)</Label>
              <Input
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateCampaign.isPending}>
              {updateCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Team Modal ───────────────────────────────────────────────────── */}
      <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team to Campaign</DialogTitle>
            <DialogDescription>Select teams to assign</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={teamModalSearch}
                onChange={(e) => setTeamModalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {teamModalSearch ? "No teams found" : "All teams are already assigned"}
                </p>
              ) : (
                availableTeams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTeamIds((prev) =>
                          checked ? [...prev, team.id] : prev.filter((x) => x !== team.id)
                        )
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.type} · {team.membersCount ?? 0} members
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamModal(false)}>Cancel</Button>
            <Button
              onClick={handleAddTeams}
              disabled={selectedTeamIds.length === 0 || assignTeams.isPending}
            >
              {assignTeams.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {selectedTeamIds.length > 0 ? `(${selectedTeamIds.length})` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add User Modal ───────────────────────────────────────────────────── */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Campaign</DialogTitle>
            <DialogDescription>Select users to assign</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userModalSearch}
                onChange={(e) => setUserModalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {userModalSearch ? "No users found" : "All users are already assigned"}
                </p>
              ) : (
                availableUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) =>
                        setSelectedUserIds((prev) =>
                          checked ? [...prev, user.id] : prev.filter((x) => x !== user.id)
                        )
                      }
                    />
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {`${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.role}{user.teamName ? ` · ${user.teamName}` : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
            <Button
              onClick={handleAddUsers}
              disabled={selectedUserIds.length === 0 || assignUsers.isPending}
            >
              {assignUsers.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Lead Modal ───────────────────────────────────────────────────── */}
      <Dialog open={showAddLeadModal} onOpenChange={setShowAddLeadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leads to Campaign</DialogTitle>
            <DialogDescription>Search and select leads to add</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={leadModalSearch}
                onChange={(e) => setLeadModalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {leadModalSearch ? "No leads found" : "Start typing to search leads"}
                </p>
              ) : (
                availableLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedLeadIds.includes(lead.id)}
                      onCheckedChange={(checked) =>
                        setSelectedLeadIds((prev) =>
                          checked ? [...prev, lead.id] : prev.filter((x) => x !== lead.id)
                        )
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lead.firstName} {lead.lastName ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.phone}{lead.city ? ` · ${lead.city}` : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLeadModal(false)}>Cancel</Button>
            <Button
              onClick={handleAddLeads}
              disabled={selectedLeadIds.length === 0 || addLeads.isPending}
            >
              {addLeads.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirm Modal ─────────────────────────────────────────────── */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Campaign?</DialogTitle>
            <DialogDescription>
              This will permanently cancel <strong>{campaign.name}</strong>. All assigned leads will be retained but the campaign cannot be reactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Keep Campaign</Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Cancel Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
