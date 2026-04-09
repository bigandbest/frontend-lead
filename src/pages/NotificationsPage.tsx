import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, X, Trash2, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkNotificationRead, useMarkAllRead, useDeleteReadNotifications } from "@/hooks/useNotifications";
import type { GetNotificationsParams } from "@/api/notifications";

const typeConfig: Record<string, { icon: string }> = {
  lead_assigned: { icon: "🔵" },
  lead_status_changed: { icon: "🟣" },
  follow_up_reminder: { icon: "🟡" },
  new_lead: { icon: "🟢" },
  team_invite: { icon: "🔷" },
  system_alert: { icon: "🔴" },
  target_achieved: { icon: "🏆" },
  target_warning: { icon: "🟠" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [page, setPage] = useState(1);

  const params: GetNotificationsParams = {
    page, limit: 20,
    isRead: activeTab === "unread" ? false : undefined,
    type: activeTab === "lead" ? undefined : activeTab === "reminders" ? "follow_up_reminder" : activeTab === "system" ? "system_alert" : undefined,
  };

  const { data, isLoading } = useNotifications(params);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const deleteRead = useDeleteReadNotifications();

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  // Group by recency based on createdAt
  function getGroup(createdAt: string): string {
    const now = new Date();
    const d = new Date(createdAt);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return "today";
    if (diffDays < 2) return "yesterday";
    return "earlier";
  }

  const groups = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "earlier", label: "Earlier" },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Notifications</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Delete Read
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="lead">Leads</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">No notifications</p>
          <p className="text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const items = filtered.filter((n) => getGroup(n.createdAt) === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{group.label}</p>
                <div className="space-y-2">
                  {items.map((n) => {
                    const config = typeConfig[n.type] ?? { icon: "📋" };
                    return (
                      <div
                        key={n.id}
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${n.isRead ? "bg-muted/30" : "bg-card border-primary/20"} hover:shadow-sm`}
                        onClick={() => {
                          if (!n.isRead) markRead.mutate(n.id);
                          if (n.actionLink) navigate(n.actionLink);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                          <span className="text-lg shrink-0">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${n.isRead ? "font-normal" : "font-semibold"}`}>{n.title}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            {n.actionLabel && (
                              <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-primary text-xs">
                                {n.actionLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Read Notifications?</DialogTitle>
            <DialogDescription>
              This will permanently delete all read notifications. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteRead.isPending}
              onClick={() => deleteRead.mutate(undefined, { onSuccess: () => setShowDeleteModal(false) })}
            >
              Delete All Read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
