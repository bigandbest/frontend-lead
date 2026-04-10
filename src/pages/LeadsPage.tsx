import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreVertical, Download, RefreshCw, Eye, Pencil, Clock, UserPlus, Trash2, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads, useLeadStats, useCreateLead, useUpdateLead, useDeleteLead, useBulkAssignLeads, useBulkUpdateLeadStatus, useExportLeads } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { useForms, useForm } from "@/hooks/useForms";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { FormField } from "@/api/forms";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Follow-up Due", value: "followup" },
];

const STATUSES = ["new", "contacted", "qualified", "negotiation", "converted", "lost", "invalid", "junk"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const SOURCES = ["field_collection", "website", "referral", "social_media", "import", "telecalling"];

export default function LeadsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, unknown>>({});
  const [capturingLocationFor, setCapturingLocationFor] = useState<string | null>(null);
  const [autoCaptureDone, setAutoCaptureDone] = useState(false);
  const [assignedToId, setAssignedToId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser && ["super_admin", "admin", "marketing_manager", "agent_supervisor"].includes(currentUser.role);

  const hasFollowUp = activeTab === "followup" ? true : undefined;
  const statusQuery = activeTab && activeTab !== "followup" ? activeTab : statusFilter || undefined;

  const { data, isLoading, refetch } = useLeads({
    page, limit: 20,
    search: search || undefined,
    status: statusQuery,
    priority: priorityFilter || undefined,
    source: sourceFilter || undefined,
    hasFollowUp,
  });
  const { data: statsData } = useLeadStats();
  const { data: usersData } = useUsers({ limit: 100, isActive: true });
  const { data: formsData } = useForms({ status: "published", limit: 100 });
  const { data: campaignsData } = useCampaigns({ status: "active", limit: 100 });
  const { data: selectedFormDetail, isLoading: selectedFormLoading } = useForm(selectedFormId);

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const bulkAssign = useBulkAssignLeads();
  const bulkStatus = useBulkUpdateLeadStatus();
  const exportLeads = useExportLeads();

  const leads = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = statsData?.data;
  const users = usersData?.data ?? [];
  const availableForms = useMemo(
    () => (formsData?.data ?? []).filter((f) => f.isPublished && f.isActive),
    [formsData]
  );
  const activeCampaigns = campaignsData?.data ?? [];
  const dynamicFields: FormField[] = useMemo(
    () => ((selectedFormDetail?.data?.fields ?? []) as FormField[]).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [selectedFormDetail]
  );

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === leads.length ? [] : leads.map((l) => l.id));

  const captureBrowserLocation = () =>
    new Promise<{ latitude: number; longitude: number; accuracy?: number; capturedAt: string }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported in this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            capturedAt: new Date().toISOString(),
          }),
        (err) => reject(new Error(err.message || "Unable to capture location.")),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();
      return (data.display_name as string) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const isEmptyValue = (value: unknown) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };

  const normalizeFieldText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const getFieldByType = (type: string) => dynamicFields.find((f) => f.type === type);
  const getFieldByLabel = (...labelHints: string[]) => {
    const normalizedHints = labelHints.map(normalizeFieldText);
    return dynamicFields.find((f) => {
      const lbl = normalizeFieldText(f.label ?? "");
      return normalizedHints.some((h) => lbl.includes(h));
    });
  };

  const getFieldValue = (field?: FormField) => (field ? dynamicFormData[field.id] : undefined);
  const getStringValue = (field?: FormField) => {
    const v = getFieldValue(field);
    return typeof v === "string" ? v.trim() : "";
  };

  const handleCaptureLocation = async (fieldId: string) => {
    try {
      setCapturingLocationFor(fieldId);
      const location = await captureBrowserLocation();
      const address = await reverseGeocode(location.latitude, location.longitude);
      setDynamicFormData((prev) => ({
        ...prev,
        [fieldId]: { ...location, address },
      }));
      toast.success("Location captured");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not capture location");
    } finally {
      setCapturingLocationFor(null);
    }
  };

  // Reset auto-capture flag when form selection changes
  useEffect(() => {
    setAutoCaptureDone(false);
  }, [selectedFormId]);

  // Auto-capture location as soon as form opens and location fields are available
  useEffect(() => {
    if (!createOpen || autoCaptureDone || dynamicFields.length === 0) return;
    const locationFields = dynamicFields.filter((f) => f.type === "location");
    if (locationFields.length === 0) return;
    setAutoCaptureDone(true);
    locationFields.forEach((field) => {
      const existing = dynamicFormData[field.id] as any;
      if (existing?.latitude) return; // already have coords
      handleCaptureLocation(field.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, autoCaptureDone, dynamicFields]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFormId) {
      toast.error("Please select a form");
      return;
    }

    const payloadFormData: Record<string, unknown> = { ...dynamicFormData };

    const requiredLocationFields = dynamicFields.filter((f) => f.type === "location");
    const needsLocation = requiredLocationFields.filter((f) => {
      const val = payloadFormData[f.id] as any;
      return !val || typeof val !== "object" || typeof val.latitude !== "number" || typeof val.longitude !== "number";
    });

    if (needsLocation.length > 0) {
      try {
        setCapturingLocationFor(needsLocation[0].id);
        const location = await captureBrowserLocation();
        const address = await reverseGeocode(location.latitude, location.longitude);
        for (const field of needsLocation) {
          payloadFormData[field.id] = { ...location, address };
        }
        setDynamicFormData((prev) => ({ ...prev, ...Object.fromEntries(needsLocation.map((f) => [f.id, payloadFormData[f.id]])) }));
      } catch (err) {
        toast.error("Browser location is mandatory for this form. Please allow location permission.");
        setCapturingLocationFor(null);
        return;
      } finally {
        setCapturingLocationFor(null);
      }
    }

    for (const field of dynamicFields) {
      const required = field.type === "location" || !!field.required || !!(field.validation as any)?.required;
      if (!required) continue;
      if (field.type === "location") {
        const val = payloadFormData[field.id] as any;
        const hasCoords = val && typeof val === "object" && typeof val.latitude === "number" && typeof val.longitude === "number";
        if (!hasCoords) {
          toast.error(`"${field.label}" requires browser location`);
          return;
        }
        continue;
      }
      if (isEmptyValue(payloadFormData[field.id])) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }

    const firstNameField =
      getFieldByLabel("firstname", "first name", "name") ||
      dynamicFields.find((f) => f.type === "text");
    const lastNameField = getFieldByLabel("lastname", "last name", "surname");
    const phoneField = getFieldByType("phone") || getFieldByLabel("phone", "mobile");
    const emailField = getFieldByType("email");
    const cityField = getFieldByLabel("city");
    const notesField = getFieldByLabel("note", "notes", "remark", "comments");

    const firstName = getStringValue(firstNameField) || "Lead";
    const phone = getStringValue(phoneField);

    if (!phone) {
      toast.error("Selected form must include a Phone field with value");
      return;
    }

    // Extract top-level location fields from the first location field
    const firstLocField = dynamicFields.find((f) => f.type === "location");
    const locVal = firstLocField ? (payloadFormData[firstLocField.id] as Record<string, unknown> | undefined) : undefined;
    const topLat = typeof locVal?.latitude === "number" ? locVal.latitude : undefined;
    const topLng = typeof locVal?.longitude === "number" ? locVal.longitude : undefined;
    const topAddress = typeof locVal?.address === "string" ? locVal.address : undefined;

    createLead.mutate(
      {
        firstName,
        lastName: getStringValue(lastNameField) || undefined,
        phone,
        email: getStringValue(emailField) || undefined,
        city: getStringValue(cityField) || undefined,
        notes: getStringValue(notesField) || undefined,
        formId: selectedFormId,
        formData: payloadFormData,
        latitude: topLat,
        longitude: topLng,
        address: topAddress,
        assignedToId: assignedToId || undefined,
        campaignId: campaignId || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setSelectedFormId("");
          setDynamicFormData({});
          setAutoCaptureDone(false);
          setAssignedToId("");
          setCampaignId("");
        },
      }
    );
  };

  const renderDynamicField = (field: FormField) => {
    const value = dynamicFormData[field.id];
    const stringValue = String(value ?? "");

    if (field.type === "textarea" || field.type === "paragraph") {
      return (
        <Textarea
          value={stringValue}
          onChange={(e) => setDynamicFormData((prev) => ({ ...prev, [field.id]: e.target.value }))}
          placeholder={field.placeholder ?? ""}
          rows={3}
        />
      );
    }

    if (field.type === "dropdown") {
      const options = field.options ?? [];
      return (
        <Select
          value={stringValue || "none"}
          onValueChange={(v) =>
            setDynamicFormData((prev) => ({ ...prev, [field.id]: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Select"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "checkbox") {
      const options = field.options ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) =>
                  setDynamicFormData((prev) => {
                    const arr = Array.isArray(prev[field.id]) ? ([...(prev[field.id] as string[])]) : [];
                    if (checked) return { ...prev, [field.id]: Array.from(new Set([...arr, opt.value])) };
                    return { ...prev, [field.id]: arr.filter((x) => x !== opt.value) };
                  })
                }
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "location") {
      const loc = (value as Record<string, unknown> | undefined) ?? {};
      const isCapturing = capturingLocationFor === field.id;
      const hasLocation = typeof loc.latitude === "number";
      const locationText = typeof loc.address === "string" && loc.address ? loc.address : "";

      return (
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={isCapturing ? "Detecting location…" : locationText || "Location not yet captured"}
              readOnly
              className={cn(
                "pr-8 bg-muted/50 cursor-default select-none",
                !hasLocation && !isCapturing && "text-muted-foreground italic"
              )}
            />
            {isCapturing && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {hasLocation && !isCapturing && (
              <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCaptureLocation(field.id)}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Detecting…</>
            ) : hasLocation ? (
              <><RefreshCw className="mr-1.5 h-3 w-3" />Refresh Location</>
            ) : (
              <><MapPin className="mr-1.5 h-3 w-3" />Detect Location</>
            )}
          </Button>
        </div>
      );
    }

    const htmlType =
      field.type === "email"
        ? "email"
        : field.type === "phone"
          ? "tel"
          : field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : field.type === "time"
                ? "time"
                : field.type === "datetime"
                  ? "datetime-local"
                  : "text";

    return (
      <Input
        type={htmlType}
        value={stringValue}
        onChange={(e) => setDynamicFormData((prev) => ({ ...prev, [field.id]: e.target.value }))}
        placeholder={field.placeholder ?? ""}
      />
    );
  };

  const handleChangeStatus = (leadId: string, status: string) => {
    updateLead.mutate({ id: leadId, payload: { status } });
  };

  const handleDelete = (leadId: string) => {
    if (confirm("Delete this lead?")) deleteLead.mutate(leadId);
  };

  const handleExport = () => {
    exportLeads.mutate({
      search: search || undefined,
      status: statusQuery,
      priority: priorityFilter || undefined,
      source: sourceFilter || undefined,
      hasFollowUp,
    });
  };

  const tabCounts: Record<string, number | undefined> = {
    "": stats?.total,
    new: stats?.byStatus?.new,
    contacted: stats?.byStatus?.contacted,
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          {stats && <p className="text-sm text-muted-foreground mt-1">{stats.total.toLocaleString()} total leads</p>}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Lead
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter || "all"} onValueChange={(v) => { setPriorityFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter || "all"} onValueChange={(v) => { setSourceFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportLeads.isPending || !leads.length}
          title={leads.length === 0 ? "No leads to export" : "Export leads to Excel"}
        >
          {exportLeads.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent border"
            )}
            onClick={() => { setActiveTab(tab.value); setPage(1); setSelected([]); }}
          >
            {tab.label}{tabCounts[tab.value] !== undefined ? ` (${tabCounts[tab.value]})` : ""}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkAssign.isPending}>
                <UserPlus className="mr-2 h-3 w-3" />Assign To
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {users.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => { bulkAssign.mutate({ leadIds: selected, assignedToId: u.id }); setSelected([]); }}>
                  {u.firstName} {u.lastName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkStatus.isPending}>Change Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => { bulkStatus.mutate({ leadIds: selected, status: s }); setSelected([]); }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={leads.length > 0 && selected.length === leads.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">Name / Phone</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Priority</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Source</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Assigned To</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Created By</th>
                <th className="p-3 text-left font-medium text-muted-foreground">City</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">No leads found</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </td>
                    <td className="p-3"><StatusBadge status={lead.status} size="sm" /></td>
                    <td className="p-3"><PriorityBadge priority={lead.priority} size="sm" /></td>
                    <td className="p-3 text-muted-foreground">
                      {lead.source ? lead.source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—"}
                    </td>
                    <td className="p-3">
                      {lead.assignedToName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {lead.assignedToName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{lead.assignedToName}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm">{lead.createdByName ?? "—"}</p>
                        {lead.createdByEmployeeId && (
                          <p className="text-xs font-mono text-primary">{lead.createdByEmployeeId}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{lead.city ?? "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/reminders?leadId=${lead.id}`)}>
                            <Clock className="mr-2 h-4 w-4" />Add Reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {STATUSES.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => handleChangeStatus(lead.id, s)}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(lead.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between p-3 border-t flex-wrap gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-xs sm:text-sm">{page}/{pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Create a new lead in your pipeline</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Form *</Label>
              <Select
                value={selectedFormId || "none"}
                onValueChange={(v) => {
                  setSelectedFormId(v === "none" ? "" : v);
                  setDynamicFormData({});
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select form (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {availableForms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Assign To (optional)</Label>
                <Select value={assignedToId || "unassigned"} onValueChange={(v) => setAssignedToId(v === "unassigned" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users
                      .filter((u) => ["marketing_agent", "field_agent", "agent_supervisor"].includes(u.role))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                          {u.employeeId && <span className="text-muted-foreground ml-1 text-xs">({u.employeeId})</span>}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeCampaigns.length > 0 && (
              <div className="space-y-1.5">
                <Label>Campaign (optional)</Label>
                <Select value={campaignId || "none"} onValueChange={(v) => setCampaignId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No campaign" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No campaign</SelectItem>
                    {activeCampaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedFormId && (
              <div className="space-y-3 border rounded-md p-3">
                <p className="text-sm font-medium">Form Fields</p>
                {selectedFormLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : dynamicFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No fields in selected form.</p>
                ) : (
                  dynamicFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label>
                        {field.label}
                        {(field.required || field.type === "location" || (field.validation as any)?.required) && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      {renderDynamicField(field)}
                      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {!selectedFormId && (
              <p className="text-xs text-muted-foreground">
                Select a form to load dynamic fields.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLead.isPending || !!capturingLocationFor}>
                {createLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
