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
  Plus, Search, MoreVertical, Eye, Pencil, Loader2, Users, FileText, Handshake, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeams, useCreateTeam } from "@/hooks/useTeams";

export default function TeamsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", type: "field" as "field" | "marketing", description: "" });

  const isActive = statusFilter === "all" ? undefined : statusFilter === "active";
  const { data, isLoading } = useTeams({
    search: search || undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
    isActive,
    limit: 50,
  });
  const createTeam = useCreateTeam();

  const teams = data?.data ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate(
      { name: newTeam.name, type: newTeam.type, description: newTeam.description || undefined },
      { onSuccess: () => { setCreateOpen(false); setNewTeam({ name: "", type: "field", description: "" }); } }
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Teams</h1>
          {data?.pagination && <p className="text-sm text-muted-foreground mt-1">{data.pagination.total} teams</p>}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Create Team
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="field">Field</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No teams found. Create your first team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      team.type === "field" ? "bg-success/10" : "bg-info/10"
                    )}>
                      {team.type === "field"
                        ? <Handshake className="h-4 w-4 text-success" />
                        : <Megaphone className="h-4 w-4 text-info" />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium rounded-full px-2 py-0.5",
                      team.type === "field" ? "bg-success/10 text-success" : "bg-info/10 text-info"
                    )}>
                      {team.type === "field" ? "Field" : "Marketing"}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/teams/${team.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Edit Team</DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold mb-1">{team.name}</h3>
                <p className="text-xs text-muted-foreground truncate mb-3">{team.description ?? "No description"}</p>

                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{team.membersCount ?? 0} members</span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{team.leadsCount ?? 0} leads</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    team.isActive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {team.isActive ? "Active" : "Inactive"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/teams/${team.id}`)}>View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Set up a new team for your organization</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g. Delhi North Team"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Team Type *</Label>
              <RadioGroup value={newTeam.type} onValueChange={(v) => setNewTeam({ ...newTeam, type: v as "field" | "marketing" })}>
                <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="field" id="field" className="mt-0.5" />
                  <label htmlFor="field" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium text-sm">🤝 Field Team</div>
                    <p className="text-xs text-muted-foreground mt-0.5">For field agents collecting leads in person</p>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="marketing" id="marketing" className="mt-0.5" />
                  <label htmlFor="marketing" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium text-sm">📣 Marketing Team</div>
                    <p className="text-xs text-muted-foreground mt-0.5">For telecalling, email, social campaigns</p>
                  </label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                rows={3}
                placeholder="Optional team description..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newTeam.name || createTeam.isPending}>
                {createTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
