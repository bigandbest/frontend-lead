import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Phone, Mail, MapPin, Clock, Copy, MoreVertical,
  Pencil, Trash2, MessageSquare, Send, Bell, Plus, CheckCircle,
  User, FileText, Activity, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLead, useLeadActivities, useUpdateLead, useDeleteLead, useAddLeadActivity } from "@/hooks/useLeads";
import { useReminders, useCreateReminder, useCompleteReminder } from "@/hooks/useReminders";
import { useForm } from "@/hooks/useForms";
import type { FormField } from "@/api/forms";

const statuses = ["new", "contacted", "qualified", "negotiation", "converted", "lost", "invalid", "junk"];
const priorities = ["low", "medium", "high", "urgent"];

const templates = [
  { id: "1", name: "Welcome Message", channel: "sms" },
  { id: "2", name: "Follow-up Reminder", channel: "whatsapp" },
  { id: "3", name: "Product Brochure", channel: "email" },
  { id: "4", name: "Special Offer", channel: "sms" },
];

const activityIconMap: Record<string, React.ReactNode> = {
  status_change: <CheckCircle className="h-4 w-4 text-primary" />,
  note: <FileText className="h-4 w-4 text-[hsl(var(--info))]" />,
  call: <Phone className="h-4 w-4 text-[hsl(var(--success))]" />,
  reminder: <Bell className="h-4 w-4 text-[hsl(var(--warning))]" />,
  template: <Send className="h-4 w-4 text-primary" />,
  created: <CheckCircle className="h-4 w-4 text-primary" />,
};

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: leadData, isLoading: leadLoading } = useLead(id!);
  const { data: activitiesData, isLoading: activitiesLoading } = useLeadActivities(id!);
  const { data: remindersData, isLoading: remindersLoading } = useReminders({ leadId: id!, limit: 20 });

  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const addActivity = useAddLeadActivity();
  const createReminder = useCreateReminder();
  const completeReminder = useCompleteReminder();

  const lead = leadData?.data;
  const { data: formDetail } = useForm(lead?.formId ?? "");
  const formFieldMap = Object.fromEntries(
    ((formDetail?.data?.fields ?? []) as FormField[]).map((f) => [f.id, f])
  );
  const activities = activitiesData?.data ?? [];
  const reminders = remindersData?.data ?? [];
  const pendingReminders = reminders.filter((r) => r.status === "pending" || r.status === "snoozed");

  const [activeTab, setActiveTab] = useState("activity");
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showReminderDrawer, setShowReminderDrawer] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderPriority, setReminderPriority] = useState<"low" | "medium" | "high">("medium");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", state: "" });

  useEffect(() => {
    if (lead) {
      setEditNotes(lead.notes ?? "");
    }
  }, [lead]);

  useEffect(() => {
    if (lead && showEditModal) {
      setEditForm({
        firstName: lead.firstName,
        lastName: lead.lastName ?? "",
        phone: lead.phone,
        email: lead.email ?? "",
        address: lead.address ?? "",
        city: lead.city ?? "",
        state: lead.state ?? "",
      });
    }
  }, [lead, showEditModal]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleStatusChange = (newStatus: string) => {
    updateLead.mutate({ id: id!, payload: { status: newStatus } });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateLead.mutate({ id: id!, payload: { priority: newPriority } });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addActivity.mutate(
      { leadId: id!, payload: { type: "note", title: "Note added", description: noteText } },
      { onSuccess: () => { setNoteText(""); setShowAddNote(false); } }
    );
  };

  const handleSaveNotes = () => {
    updateLead.mutate({ id: id!, payload: { notes: editNotes } });
  };

  const handleSendTemplate = () => {
    if (!selectedTemplate) return;
    toast.success("Template sent successfully");
    setSelectedTemplate("");
    setShowTemplateModal(false);
  };

  const applyQuickSet = (offset: string) => {
    const now = new Date();
    if (offset === "+15min") now.setMinutes(now.getMinutes() + 15);
    else if (offset === "+30min") now.setMinutes(now.getMinutes() + 30);
    else if (offset === "+1hr") now.setHours(now.getHours() + 1);
    else if (offset === "Tomorrow") { now.setDate(now.getDate() + 1); now.setHours(10, 0, 0, 0); }
    else if (offset === "+3days") { now.setDate(now.getDate() + 3); now.setHours(10, 0, 0, 0); }
    setReminderDate(now.toISOString().split("T")[0]);
    setReminderTime(now.toTimeString().slice(0, 5));
  };

  const handleAddReminder = () => {
    if (!reminderTitle || !reminderDate) return;
    const reminderAt = reminderTime
      ? new Date(`${reminderDate}T${reminderTime}`).toISOString()
      : new Date(`${reminderDate}T10:00`).toISOString();
    createReminder.mutate(
      { leadId: id!, title: reminderTitle, reminderAt, priority: reminderPriority },
      {
        onSuccess: () => {
          setReminderTitle(""); setReminderDate(""); setReminderTime("");
          setShowReminderDrawer(false);
        },
      }
    );
  };

  const handleEditSave = () => {
    updateLead.mutate(
      { id: id!, payload: editForm },
      { onSuccess: () => setShowEditModal(false) }
    );
  };

  const handleDelete = () => {
    deleteLead.mutate(id!, {
      onSuccess: () => navigate("/leads"),
    });
  };

  if (leadLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[500px] rounded-xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </div>
      </AppLayout>
    );
  }

  const assignedInitials = getInitials(lead.assignedToName);
  const leadInitials = `${lead.firstName[0]}${(lead.lastName ?? "")[0] ?? ""}`.toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {lead.firstName} {lead.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Lead · Created {fmtTime(lead.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(true)}>
              <Send className="h-4 w-4 mr-1" /> Send Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowReminderDrawer(true)}>
              <Bell className="h-4 w-4 mr-1" /> Add Reminder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(lead.phone)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Phone
                </DropdownMenuItem>
                {lead.email && (
                  <DropdownMenuItem onClick={() => copyToClipboard(lead.email!)}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {leadInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{lead.firstName} {lead.lastName}</p>
                    {lead.source && <p className="text-sm text-muted-foreground">via {lead.source}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.phone}</span>
                    <button onClick={() => copyToClipboard(lead.phone)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground break-all">{lead.email}</span>
                      <button onClick={() => copyToClipboard(lead.email!)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {(lead.address || lead.city) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">
                        {[lead.address, lead.city, lead.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Priority */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={lead.status}
                    onValueChange={handleStatusChange}
                    disabled={updateLead.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          <StatusBadge status={s} size="sm" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select
                    value={lead.priority}
                    onValueChange={handlePriorityChange}
                    disabled={updateLead.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>
                          <PriorityBadge priority={p} size="sm" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {lead.source && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <p className="text-sm font-medium text-foreground capitalize">{lead.source.replace("_", " ")}</p>
                  </div>
                )}
                {lead.assignedToName && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{assignedInitials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{lead.assignedToName}</span>
                    </div>
                  </div>
                )}
                {lead.dealValue != null && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Deal Value</Label>
                    <p className="text-sm font-medium text-foreground">₹{lead.dealValue.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {(lead.tags && lead.tags.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Data */}
            {lead.formData && Object.keys(lead.formData).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Form Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(lead.formData).map(([key, value]) => {
                      const field = formFieldMap[key];
                      const label = field?.label ?? key;
                      let display: React.ReactNode;
                      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
                        const loc = value as Record<string, unknown>;
                        if (typeof loc.latitude === "number") {
                          const addr = typeof loc.address === "string" && loc.address
                            ? loc.address
                            : `${(loc.latitude as number).toFixed(5)}, ${(loc.longitude as number).toFixed(5)}`;
                          display = (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span className="break-words">{addr}</span>
                            </div>
                          );
                        } else {
                          display = JSON.stringify(value);
                        }
                      } else if (Array.isArray(value)) {
                        display = (value as unknown[]).join(", ");
                      } else {
                        display = String(value ?? "—");
                      }
                      return (
                        <div key={key}>
                          <p className="text-xs text-muted-foreground capitalize">{label}</p>
                          <p className="text-sm font-medium text-foreground">{display}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                <TabsTrigger value="reminders">
                  Reminders {pendingReminders.length > 0 && `(${pendingReminders.length})`}
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              {/* Activity Timeline */}
              <TabsContent value="activity">
                <Card>
                  <CardContent className="pt-6">
                    {activitiesLoading ? (
                      <div className="space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex gap-4">
                            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                        <div className="space-y-6">
                          {activities.length === 0 ? (
                            <p className="pl-10 text-sm text-muted-foreground">No activity yet</p>
                          ) : (
                            activities.map((activity) => (
                              <div key={activity.id} className="relative flex gap-4 pl-10">
                                <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                                  {activityIconMap[activity.type] ?? <Activity className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                      {fmtTime(activity.createdAt)}
                                    </span>
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">by {activity.createdByName}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add Note Inline */}
                    <div className="mt-6 pt-4 border-t border-border">
                      {showAddNote ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Write a note about this lead..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleAddNote}
                              disabled={!noteText.trim() || addActivity.isPending}
                            >
                              {addActivity.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              Save Note
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowAddNote(false); setNoteText(""); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setShowAddNote(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Note
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reminders Tab */}
              <TabsContent value="reminders">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-foreground">Reminders</p>
                      <Button size="sm" variant="outline" onClick={() => setShowReminderDrawer(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Add Reminder
                      </Button>
                    </div>
                    {remindersLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                      </div>
                    ) : reminders.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No reminders set for this lead</p>
                    ) : (
                      reminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            reminder.status === "completed" || reminder.status === "cancelled"
                              ? "bg-muted/50 opacity-60"
                              : "bg-background"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              reminder.priority === "high" || reminder.priority === "urgent"
                                ? "bg-destructive"
                                : reminder.priority === "medium"
                                ? "bg-[hsl(var(--warning))]"
                                : "bg-muted-foreground"
                            )} />
                            <div>
                              <p className={cn(
                                "text-sm font-medium",
                                reminder.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                              )}>
                                {reminder.title}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {fmtTime(reminder.reminderAt)}
                              </p>
                            </div>
                          </div>
                          {reminder.status !== "completed" && reminder.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={completeReminder.isPending}
                              onClick={() => completeReminder.mutate({ id: reminder.id })}
                            >
                              <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add notes about this lead..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={6}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={updateLead.isPending}
                      >
                        {updateLead.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Save Notes
                      </Button>

                      {/* Note activities */}
                      {activities.filter((a) => a.type === "note").length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Logged Notes</p>
                          {activities
                            .filter((a) => a.type === "note")
                            .map((a) => (
                              <div key={a.id} className="p-3 rounded-lg border bg-background">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground">{a.createdByName}</span>
                                  <span className="text-xs text-muted-foreground">{fmtTime(a.createdAt)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{a.description}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Send Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Template</DialogTitle>
            <DialogDescription>
              Send a message template to {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{lead.firstName} {lead.lastName} · {lead.phone}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {t.channel === "email" ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplate && (
              <div className="p-3 rounded-md border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="text-sm text-foreground">
                  Hi {lead.firstName}, thank you for your interest! We'd love to connect with you. Please reply or call us back.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
            <Button onClick={handleSendTemplate} disabled={!selectedTemplate}>
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Drawer */}
      <Sheet open={showReminderDrawer} onOpenChange={setShowReminderDrawer}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Reminder</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Lead</Label>
              <div className="p-2 rounded-md border bg-muted/50">
                <span className="text-sm text-foreground">{lead.firstName} {lead.lastName} · {lead.phone}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Follow-up call"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {["+15min", "+30min", "+1hr", "Tomorrow", "+3days"].map((q) => (
                <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => applyQuickSet(q)}>{q}</Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={reminderPriority} onValueChange={(v) => setReminderPriority(v as "low" | "medium" | "high")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowReminderDrawer(false)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleAddReminder}
                disabled={!reminderTitle || !reminderDate || createReminder.isPending}
              >
                {createReminder.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Save Reminder
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Lead Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead contact information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateLead.isPending}>
              {updateLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {lead.firstName} {lead.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
