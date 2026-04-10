import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, MoreVertical, Eye, Pencil, Play, Pause, CheckCircle, XCircle,
  Users, FileText, CalendarDays, IndianRupee, Phone, Mail, MessageSquare, Shuffle, Handshake, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampaigns, useCreateCampaign, useUpdateCampaignStatus } from "@/hooks/useCampaigns";
import { useTeams } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { Checkbox } from "@/components/ui/checkbox";

const campaignTypeIcons: Record<string, { icon: React.ElementType; label: string }> = {
  field_collection: { icon: Handshake, label: "Field Collection" },
  telecalling: { icon: Phone, label: "Telecalling" },
  email: { icon: Mail, label: "Email" },
  sms: { icon: MessageSquare, label: "SMS" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp" },
  mixed: { icon: Shuffle, label: "Mixed" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  active: { color: "bg-success/15 text-success", label: "Active" },
  paused: { color: "bg-warning/15 text-warning", label: "Paused" },
  completed: { color: "bg-primary/15 text-primary", label: "Completed" },
  cancelled: { color: "bg-destructive/15 text-destructive", label: "Cancelled" },
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Done", value: "completed" },
];

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState({
    name: "", description: "", type: "field_collection", startDate: "", endDate: "", budget: "",
  });
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  const { data, isLoading } = useCampaigns({
    search: search || undefined,
    status: activeTab || undefined,
    type: typeFilter || undefined,
    limit: 50,
  });
  const createCampaign = useCreateCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const { data: teamsData } = useTeams({ limit: 200, isActive: true });
  const { data: usersData } = useUsers({ limit: 200, isActive: true, role: undefined });

  const campaigns = data?.data ?? [];
  const pagination = data?.pagination;
  const teams = teamsData?.data ?? [];
  const agentUsers = (usersData?.data ?? []).filter((u) =>
    ["marketing_agent", "field_agent", "agent_supervisor"].includes(u.role)
  );

  const resetCreate = () => {
    setCreateOpen(false);
    setStep(1);
    setNewCampaign({ name: "", description: "", type: "field_collection", startDate: "", endDate: "", budget: "" });
    setAssignedTeamIds([]);
    setAssignedUserIds([]);
  };

  const toggleId = (list: string[], id: string, setter: (v: string[]) => void) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleCreate = () => {
    createCampaign.mutate(
      {
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        type: newCampaign.type,
        startDate: newCampaign.startDate ? new Date(newCampaign.startDate).toISOString() : undefined,
        endDate: newCampaign.endDate ? new Date(newCampaign.endDate).toISOString() : undefined,
        budget: newCampaign.budget ? Number(newCampaign.budget) : undefined,
        assignedTeamIds: assignedTeamIds.length > 0 ? assignedTeamIds : undefined,
        assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : undefined,
      },
      { onSuccess: resetCreate }
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Campaigns</h1>
          {pagination && <p className="text-sm text-muted-foreground mt-1">{pagination.total} total campaigns</p>}
        </div>
        <Button onClick={() => { setCreateOpen(true); setStep(1); }}>
          <Plus className="mr-2 h-4 w-4" />New Campaign
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(campaignTypeIcons).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === tab.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent border"
            )}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No campaigns found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const typeKey = Object.keys(campaignTypeIcons).find((k) => campaign.type?.includes(k)) ?? "mixed";
            const typeInfo = campaignTypeIcons[typeKey] ?? campaignTypeIcons.mixed;
            const TypeIcon = typeInfo.icon;
            const status = statusConfig[campaign.status] ?? statusConfig.draft;

            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />{typeInfo.label}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(campaign.status === "draft" || campaign.status === "paused") && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: campaign.id, status: "active" })}>
                            <Play className="mr-2 h-4 w-4" />Activate
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "active" && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: campaign.id, status: "paused" })}>
                            <Pause className="mr-2 h-4 w-4" />Pause
                          </DropdownMenuItem>
                        )}
                        {(campaign.status === "active" || campaign.status === "paused") && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: campaign.id, status: "completed" })}>
                            <CheckCircle className="mr-2 h-4 w-4" />Complete
                          </DropdownMenuItem>
                        )}
                        {campaign.status !== "completed" && campaign.status !== "cancelled" && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: campaign.id, status: "cancelled" })}>
                            <XCircle className="mr-2 h-4 w-4" />Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="border-t pt-3 mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{campaign.leadsCount ?? 0} leads</div>
                    <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{campaign.teamsCount ?? 0} teams · {campaign.usersCount ?? 0} users</div>
                    {(campaign.startDate || campaign.endDate) && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        {" – "}
                        {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </div>
                    )}
                    {campaign.budget !== undefined && (
                      <div className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />₹{campaign.budget.toLocaleString()} budget</div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 border-t pt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/campaigns/${campaign.id}`)}>View</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={resetCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Campaign — Step {step} of 3</DialogTitle>
            <DialogDescription>
              {step === 1 ? "Basic information about your campaign" : step === 2 ? "Dates, budget and launch" : "Assign teams and agents"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g. Delhi Field Drive Q1" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Campaign Type *</Label>
                <RadioGroup value={newCampaign.type} onValueChange={(v) => setNewCampaign({ ...newCampaign, type: v })}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(campaignTypeIcons).map(([k, v]) => {
                      const Icon = v.icon;
                      return (
                        <div key={k} className="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50">
                          <RadioGroupItem value={k} id={`type-${k}`} />
                          <label htmlFor={`type-${k}`} className="flex items-center gap-2 cursor-pointer text-sm">
                            <Icon className="h-4 w-4 text-muted-foreground" />{v.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Budget (optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">₹</span>
                  <Input type="number" placeholder="50000" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Teams */}
              <div>
                <p className="text-sm font-medium mb-2">Assign Teams</p>
                {teams.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active teams</p>
                ) : (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {teams.map((t) => (
                      <label key={t.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={assignedTeamIds.includes(t.id)}
                          onCheckedChange={() => toggleId(assignedTeamIds, t.id, setAssignedTeamIds)}
                        />
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* Agents */}
              <div>
                <p className="text-sm font-medium mb-2">Assign Agents / Supervisors</p>
                {agentUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No agents available</p>
                ) : (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {agentUsers.map((u) => (
                      <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={assignedUserIds.includes(u.id)}
                          onCheckedChange={() => toggleId(assignedUserIds, u.id, setAssignedUserIds)}
                        />
                        <div>
                          <p className="text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{u.role.replace(/_/g, " ")}{u.employeeId ? ` · ${u.employeeId}` : ""}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {(assignedTeamIds.length > 0 || assignedUserIds.length > 0) && (
                <p className="text-xs text-muted-foreground">
                  {assignedTeamIds.length} team(s) · {assignedUserIds.length} agent(s) selected
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-row justify-between gap-2">
            <div>
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>← Back</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCreate}>Cancel</Button>
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !newCampaign.name}>Next →</Button>
              ) : (
                <Button onClick={handleCreate} disabled={createCampaign.isPending || !newCampaign.name}>
                  {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Campaign
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
