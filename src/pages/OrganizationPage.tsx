import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, Building2, FileText, ClipboardList, Megaphone } from "lucide-react";
import { useOrganization, useOrgStats, useUpdateOrganization } from "@/hooks/useOrganization";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type DayHours = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

const defaultHours = (): DayHours[] => days.map((day, i) => ({
  day,
  enabled: i < 5,
  start: "09:00",
  end: "18:00",
}));

export default function OrganizationPage() {
  const { data: orgResponse, isLoading: orgLoading } = useOrganization();
  const { data: statsResponse, isLoading: statsLoading } = useOrgStats();
  const updateOrganization = useUpdateOrganization();

  const org = orgResponse?.data;
  const stats = statsResponse?.data;

  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [maxLeadsPerAgent, setMaxLeadsPerAgent] = useState<number>(50);

  useEffect(() => {
    if (!org) return;

    setName(org.name ?? "");
    setTimezone(org.settings?.timezone ?? "Asia/Kolkata");
    setCurrency(org.settings?.currency ?? "INR");
    setMaxLeadsPerAgent(org.settings?.maxLeadsPerAgent ?? 50);

    const workingHours = org.settings?.workingHours;
    if (!workingHours) {
      setHours(defaultHours());
      return;
    }

    setHours(days.map((day, i) => {
      const key = day.toLowerCase();
      const value = workingHours[key];
      return {
        day,
        enabled: value?.enabled ?? i < 5,
        start: value?.start ?? "09:00",
        end: value?.end ?? "18:00",
      };
    }));
  }, [org]);

  const toggleDay = (i: number) => {
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, enabled: !h.enabled } : h));
  };

  const updateTime = (i: number, field: "start" | "end", value: string) => {
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };

  const applyToAll = () => {
    const monday = hours[0];
    setHours((prev) => prev.map((h) => h.enabled ? { ...h, start: monday.start, end: monday.end } : h));
    toast.success("Applied Monday hours to all enabled days");
  };

  const saveChanges = () => {
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    const workingHours = hours.reduce<Record<string, { enabled: boolean; start: string; end: string }>>((acc, h) => {
      acc[h.day.toLowerCase()] = { enabled: h.enabled, start: h.start, end: h.end };
      return acc;
    }, {});

    updateOrganization.mutate({
      name: name.trim(),
      settings: {
        ...(org?.settings ?? {}),
        timezone,
        currency,
        maxLeadsPerAgent,
        workingHours,
      },
    });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Organization Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Working Hours</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {orgLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{org?.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Logo updates are not configured yet</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization Slug</Label>
                      <Input value={org?.slug ?? ""} disabled className="text-muted-foreground" />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Localization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">US/Eastern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR - ₹</SelectItem>
                            <SelectItem value="USD">USD - $</SelectItem>
                            <SelectItem value="EUR">EUR - €</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Lead Settings</h4>
                    <div className="space-y-2 max-w-xs">
                      <Label>Max Leads Per Agent</Label>
                      <Input
                        type="number"
                        value={maxLeadsPerAgent}
                        onChange={(e) => setMaxLeadsPerAgent(Number(e.target.value || 0))}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button onClick={saveChanges} disabled={updateOrganization.isPending || orgLoading}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <p className="text-sm text-muted-foreground">Configure when your team is expected to be active</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <span>Day</span><span>Enabled</span><span>Start Time</span><span>End Time</span>
                </div>
                {hours.map((h, i) => (
                  <div key={h.day} className={`grid grid-cols-4 gap-4 items-center ${!h.enabled ? "opacity-50" : ""}`}>
                    <span className="text-sm font-medium">{h.day}</span>
                    <Checkbox checked={h.enabled} onCheckedChange={() => toggleDay(i)} />
                    <Input
                      type="time"
                      value={h.start}
                      onChange={(e) => updateTime(i, "start", e.target.value)}
                      disabled={!h.enabled}
                      className="h-9"
                    />
                    <Input
                      type="time"
                      value={h.end}
                      onChange={(e) => updateTime(i, "end", e.target.value)}
                      disabled={!h.enabled}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={applyToAll}>Apply Mon-Fri to All</Button>
                <Button variant="outline" size="sm" onClick={() => setHours(defaultHours())}>Reset to Defaults</Button>
              </div>
              <div className="mt-4">
                <Button onClick={saveChanges} disabled={updateOrganization.isPending}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Organization Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[
                    { label: "Total Users", value: String(stats?.totalUsers ?? 0), icon: Users },
                    { label: "Active Users", value: String(stats?.activeUsers ?? 0), icon: Users },
                    { label: "Total Leads", value: String(stats?.totalLeads ?? 0), icon: FileText },
                    { label: "Teams", value: String(stats?.totalTeams ?? 0), icon: Users },
                    { label: "Forms", value: String(stats?.totalForms ?? 0), icon: ClipboardList },
                    { label: "Campaigns", value: String(stats?.totalCampaigns ?? 0), icon: Megaphone },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                      <stat.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
