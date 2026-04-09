import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RoleBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Plus, Search, X, Users, TrendingUp, Percent, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTeam, useAddTeamMember, useRemoveTeamMember, useUpdateTeam } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";

export default function TeamDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState<string | null>(null);
  const [searchMembers, setSearchMembers] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const { data: teamData, isLoading } = useTeam(id || "");
  const { data: usersData } = useUsers({ limit: 200, isActive: true });
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const updateTeam = useUpdateTeam();

  const team = teamData?.data;
  const members = team?.members || [];
  const memberToRemove = members.find((m) => m.userId === removeOpen);
  const existingMemberIds = new Set(members.map((m) => m.userId));

  const availableUsers = (usersData?.data ?? [])
    .filter((user) => !existingMemberIds.has(user.id))
    .filter((user) => {
      if (!searchMembers.trim()) return true;
      const q = searchMembers.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(q)
        || user.lastName.toLowerCase().includes(q)
        || user.email.toLowerCase().includes(q)
      );
    });

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    selectedUsers.forEach((userId) => {
      addMember.mutate({ teamId: id || "", userId });
    });
    toast.success(`${selectedUsers.length} member(s) added`);
    setAddOpen(false);
    setSelectedUsers([]);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ teamId: id || "", userId }, {
      onSuccess: () => setRemoveOpen(null),
    });
  };

  const handleOpenEdit = () => {
    setEditForm({ name: team.name, description: team.description || "" });
    setEditOpen(true);
  };

  const handleEditTeam = () => {
    if (!editForm.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    updateTeam.mutate(
      {
        id: id || "",
        payload: {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
        },
      },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/teams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Teams
          </Button>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
      </AppLayout>
    );
  }

  if (!team) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Team not found</p>
          <Button onClick={() => navigate("/teams")} variant="outline" className="mt-4">
            Back to Teams
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/teams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />Teams
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                team.type === "field" ? "bg-success/10" : "bg-primary/10"
              )}>
                <Handshake className={cn(
                  "h-5 w-5",
                  team.type === "field" ? "text-success" : "text-primary"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium rounded-full px-2 py-0.5",
                team.type === "field" 
                  ? "bg-success/10 text-success" 
                  : "bg-primary/10 text-primary"
              )}>
                {team.type === "field" ? "Field Team" : "Marketing Team"}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground mt-1">
              {team.description} — {members.length} members
            </p>
          </div>
          <div className="flex gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
              team.isActive
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            )}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {team.isActive ? "Active" : "Inactive"}
            </span>
            <Button variant="outline" onClick={handleOpenEdit}><Pencil className="mr-2 h-4 w-4" />Edit Team</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9 h-9 w-48" value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)} />
                </div>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" />Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No members yet. Add your first member.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Member</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Role</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Joined</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter((m) => !searchMembers || m.firstName.toLowerCase().includes(searchMembers.toLowerCase()) || m.lastName.toLowerCase().includes(searchMembers.toLowerCase()))
                      .map((member) => (
                      <tr key={member.userId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {`${member.firstName[0]}${member.lastName[0]}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{member.firstName} {member.lastName}</span>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3"><RoleBadge role={member.role} /></td>
                        <td className="py-3 text-muted-foreground">{new Date(member.joinedAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setRemoveOpen(member.userId)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">{team.leadsCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Member Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members to {team.name}</DialogTitle>
            <DialogDescription>Select team members to add</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." className="pl-9" value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-60 overflow-auto">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No eligible users found</p>
              ) : availableUsers.map((user) => (
                <label
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedUsers.includes(user.id) ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => setSelectedUsers((s) => s.includes(user.id) ? s.filter((x) => x !== user.id) : [...s, user.id])}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </label>
              ))}
            </div>
            {selectedUsers.length > 0 && (
              <p className="text-sm text-muted-foreground">✓ Selected: {selectedUsers.length} user(s)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setSelectedUsers([]); }}>Cancel</Button>
            <Button disabled={selectedUsers.length === 0} onClick={handleAddMembers}>
              Add {selectedUsers.length || ""} Member{selectedUsers.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog open={!!removeOpen} onOpenChange={() => setRemoveOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Team?</DialogTitle>
            <DialogDescription>
              "{memberToRemove?.firstName} {memberToRemove?.lastName}" will be removed from "{team.name}". Their data remains in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleRemoveMember(removeOpen || "")}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Team Name</label>
              <Input
                className="mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                className="mt-1"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTeam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
