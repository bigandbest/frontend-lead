import { useState } from "react";
import { Bell, Search, LogOut, User, Lock, BarChart3, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkNotificationRead } from "@/hooks/useNotifications";

const typeIconMap: Record<string, string> = {
  lead_assigned: "🔵", lead_status_changed: "🟣", follow_up_reminder: "🟡",
  new_lead: "🟢", team_invite: "🔷", system_alert: "🔴", target_achieved: "🏆", target_warning: "🟠",
};

export function Topbar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("all");

  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications({ limit: 10, isRead: drawerTab === "unread" ? false : undefined });
  const markAllReadMut = useMarkAllRead();
  const markReadMut = useMarkNotificationRead();

  const unreadCount = unreadData?.data?.count ?? 0;
  const notifications = notifData?.data ?? [];
  const filteredNotifs = drawerTab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const markAllRead = () => markAllReadMut.mutate();
  const markRead = (id: string) => markReadMut.mutate(id);

  return (
    <>
      <header className="h-14 border-b bg-card flex items-center px-4 gap-4 shrink-0">
        <SidebarTrigger />

        <div className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads, users, campaigns..."
              className="pl-9 h-9 bg-secondary border-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setDrawerOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] rounded-full"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{fullName}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  {user?.role && (
                    <Badge variant="secondary" className="mt-1 w-fit text-xs capitalize">
                      {user.role.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings/password")}>
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/targets")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                My Performance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logout.isPending ? "Signing out…" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Notification Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:w-[380px] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
              </Button>
            </div>
            <SheetDescription className="sr-only">Your recent notifications</SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-2">
            <Tabs value={drawerTab} onValueChange={setDrawerTab}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Unread ({unreadCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg p-3 cursor-pointer transition-colors ${
                      n.isRead ? "bg-muted/30" : "bg-card border border-primary/20"
                    } hover:bg-accent`}
                    onClick={() => { markRead(n.id); if (n.actionLink) navigate(n.actionLink); setDrawerOpen(false); }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <span className="text-sm shrink-0">{typeIconMap[n.type] ?? "📋"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs leading-snug ${n.isRead ? "" : "font-semibold"}`}>{n.title}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-3 flex items-center justify-between">
            <Button variant="link" size="sm" className="text-xs p-0" onClick={() => { navigate("/notifications"); setDrawerOpen(false); }}>
              View All Notifications →
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
