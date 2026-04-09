import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Plus, MoreVertical, Clock, AlertTriangle, Calendar, CheckCircle, Bell, Loader2, ChevronsUpDown } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useReminders, useCreateReminder, useSnoozeReminder, useCompleteReminder } from "@/hooks/useReminders";
import { useLeads } from "@/hooks/useLeads";
import type { Reminder } from "@/api/reminders";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-destructive text-destructive-foreground",
};

const SNOOZE_OPTIONS = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "1 day", value: 1440 },
];

function groupReminder(r: Reminder): string {
  const now = new Date();
  const due = new Date(r.reminderAt);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(now); tomorrowEnd.setDate(now.getDate() + 1); tomorrowEnd.setHours(23, 59, 59, 999);
  if (due < now) return "overdue";
  if (due <= todayEnd) return "today";
  if (due <= tomorrowEnd) return "tomorrow";
  return "later";
}

export default function RemindersPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [completeNote, setCompleteNote] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [newForm, setNewForm] = useState({ leadId: "", title: "", description: "", date: "", time: "", priority: "medium" as "low" | "medium" | "high" });
  const preselectedLeadId = searchParams.get("leadId") || "";

  const { data: leadsData } = useLeads({ search: leadSearch || undefined, limit: 50 });

  const statusParam = activeTab === "completed" ? "completed" : activeTab === "all" || activeTab === "overdue" || activeTab === "today" ? "pending" : "pending";
  const isOverdue = activeTab === "overdue" ? true : undefined;

  const { data, isLoading } = useReminders({
    status: statusParam,
    priority: priorityFilter || undefined,
    isOverdue,
    limit: 50,
  });
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  const { data: allCountData } = useReminders({ status: "pending", limit: 1 });
  const { data: overdueCountData } = useReminders({ status: "pending", isOverdue: true, limit: 1 });
  const { data: todayCountData } = useReminders({
    status: "pending",
    dateFrom: dayStart.toISOString(),
    dateTo: dayEnd.toISOString(),
    limit: 1,
  });
  const { data: completedCountData } = useReminders({ status: "completed", limit: 1 });

  const createReminder = useCreateReminder();
  const snooze = useSnoozeReminder();
  const complete = useCompleteReminder();

  const reminders = data?.data ?? [];
  const leads = leadsData?.data ?? [];
  const selectedLead = leads.find((lead) => lead.id === newForm.leadId);
  const allCount = allCountData?.meta?.total ?? allCountData?.pagination?.total ?? 0;
  const overdueCount = overdueCountData?.meta?.total ?? overdueCountData?.pagination?.total ?? 0;
  const todayCount = todayCountData?.meta?.total ?? todayCountData?.pagination?.total ?? 0;
  const completedCount = completedCountData?.meta?.total ?? completedCountData?.pagination?.total ?? 0;

  useEffect(() => {
    if (!preselectedLeadId) return;
    setNewForm((prev) => ({ ...prev, leadId: prev.leadId || preselectedLeadId }));
  }, [preselectedLeadId]);

  const filtered = reminders.filter((r) => {
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || (r.leadName ?? "").toLowerCase().includes(q);
  });

  const groupedFiltered = activeTab === "today"
    ? filtered.filter((r) => groupReminder(r) === "today")
    : activeTab === "overdue"
    ? filtered.filter((r) => groupReminder(r) === "overdue")
    : filtered;

  const groups = [
    { key: "overdue", label: "Overdue", bg: "bg-destructive/5" },
    { key: "today", label: "Today", bg: "bg-amber-50" },
    { key: "tomorrow", label: "Tomorrow", bg: "" },
    { key: "later", label: "Later", bg: "" },
  ];

  const handleCreate = () => {
    if (!newForm.leadId || !newForm.title || !newForm.date) return;
    const reminderAt = new Date(`${newForm.date}T${newForm.time || "09:00"}`).toISOString();
    createReminder.mutate(
      { leadId: newForm.leadId, title: newForm.title, description: newForm.description || undefined, reminderAt, priority: newForm.priority },
      { onSuccess: () => { setShowCreateDrawer(false); setNewForm({ leadId: "", title: "", description: "", date: "", time: "", priority: "medium" }); } }
    );
  };

  const handleComplete = () => {
    if (!selectedReminder) return;
    complete.mutate(
      { id: selectedReminder.id, note: completeNote || undefined },
      { onSuccess: () => { setShowCompleteModal(false); setCompleteNote(""); setSelectedReminder(null); } }
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Reminders</h1>
        <Button onClick={() => setShowCreateDrawer(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Reminder
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reminders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All ({allCount})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-destructive text-xs sm:text-sm">⚠ Overdue ({overdueCount})</TabsTrigger>
          <TabsTrigger value="today" className="text-xs sm:text-sm">📅 Today ({todayCount})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Done ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : groupedFiltered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No reminders found</div>
      ) : activeTab === "all" || activeTab === "completed" ? (
        <div className="space-y-6">
          {groups.map((group) => {
            const items = groupedFiltered.filter((r) => groupReminder(r) === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{group.label}</p>
                <ReminderList items={items} group={group.key} snooze={snooze} onComplete={(r) => { setSelectedReminder(r); setShowCompleteModal(true); }} />
              </div>
            );
          })}
        </div>
      ) : (
        <ReminderList items={groupedFiltered} group={activeTab} snooze={snooze} onComplete={(r) => { setSelectedReminder(r); setShowCompleteModal(true); }} />
      )}

      {/* Complete Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Reminder</DialogTitle>
            <DialogDescription>"{selectedReminder?.title}"</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Completion Note (optional)</Label>
            <Textarea
              placeholder="What happened? What was the outcome?"
              className="mt-1"
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Bell className="h-4 w-4" /> A follow-up activity will be logged on {selectedReminder?.leadName}'s lead automatically.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={complete.isPending}>
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reminder Drawer */}
      <Sheet open={showCreateDrawer} onOpenChange={setShowCreateDrawer}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Reminder</SheetTitle>
            <SheetDescription>Create a new follow-up reminder</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Lead *</Label>
              <Popover open={leadPickerOpen} onOpenChange={setLeadPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="mt-1 w-full justify-between"
                  >
                    {selectedLead
                      ? `${selectedLead.firstName} ${selectedLead.lastName ?? ""} • ${selectedLead.phone}`.trim()
                      : newForm.leadId
                        ? `Selected lead (${newForm.leadId.slice(0, 8)}...)`
                        : "Select a lead"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search lead by name or phone..."
                      value={leadSearch}
                      onValueChange={setLeadSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No leads found.</CommandEmpty>
                      <CommandGroup>
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={`${lead.firstName} ${lead.lastName ?? ""} ${lead.phone} ${lead.id}`}
                            onSelect={() => {
                              setNewForm({ ...newForm, leadId: lead.id });
                              setLeadPickerOpen(false);
                            }}
                          >
                            {lead.firstName} {lead.lastName ?? ""} • {lead.phone}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Pick a lead from the list. No UUID typing needed.
              </p>
            </div>
            <Separator />
            <div>
              <Label>Title *</Label>
              <Input
                placeholder='e.g. "Follow-up call"'
                className="mt-1"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Additional details..."
                className="mt-1"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" className="mt-1" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" className="mt-1" value={newForm.time} onChange={(e) => setNewForm({ ...newForm, time: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={newForm.priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewForm({ ...newForm, priority: p })}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDrawer(false)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!newForm.leadId || !newForm.title || !newForm.date || createReminder.isPending}
              >
                {createReminder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Reminder
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function ReminderList({
  items, group, snooze, onComplete,
}: {
  items: Reminder[];
  group: string;
  snooze: ReturnType<typeof useSnoozeReminder>;
  onComplete: (r: Reminder) => void;
}) {
  return (
    <div className={cn("space-y-3 rounded-lg", group === "overdue" ? "bg-destructive/5 p-3" : group === "today" ? "bg-amber-50/50 p-3" : "")}>
      {items.map((reminder) => (
        <Card key={reminder.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {group === "overdue" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                {group === "today" && <Clock className="h-4 w-4 text-warning" />}
                {(group === "tomorrow" || group === "later") && <Calendar className="h-4 w-4 text-info" />}
                <span className="text-sm text-muted-foreground">
                  {new Date(reminder.reminderAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <Badge className={priorityColors[reminder.priority]}>{reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}</Badge>
            </div>
            <p className="font-semibold text-sm mb-1">{reminder.title}</p>
            {reminder.leadName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>📱 {reminder.leadName}</span>
                {reminder.leadPhone && <><span>·</span><span>{reminder.leadPhone}</span></>}
                {reminder.leadStatus && <><span>·</span><StatusBadge status={reminder.leadStatus} size="sm" /></>}
              </div>
            )}
            {reminder.description && <p className="text-sm text-muted-foreground truncate">{reminder.description}</p>}

            {reminder.status !== "completed" && (
              <div className="flex items-center gap-2 mt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={snooze.isPending}>Snooze ▼</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Snooze for:</p>
                    {SNOOZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
                        onClick={() => snooze.mutate({ id: reminder.id, snoozeMinutes: opt.value })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <Button size="sm" variant="default" onClick={() => onComplete(reminder)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Complete
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Reminder</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Cancel Reminder</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
