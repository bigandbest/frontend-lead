import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Megaphone,
  FileText,
  ClipboardList,
  Target,
  BarChart3,
  Building2,
  UserCircle,
  UsersRound,
  Bell,
  Settings,
  Receipt,
  LayoutTemplate,
  PackageSearch,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ADMIN_PLUS_ROLES, MANAGER_PLUS_ROLES, NON_FIELD_AGENT_ROLES, hasAnyRole, type AppRole } from "@/lib/rbac";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useReminders } from "@/hooks/useReminders";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type SidebarItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
  allowedRoles?: AppRole[];
};

const mainItems: SidebarItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Reminders", url: "/reminders", icon: Clock },
  { title: "Attendance", url: "/attendance", icon: CalendarDays },
];

const campaignItems: SidebarItem[] = [
  { title: "Campaigns", url: "/campaigns", icon: Megaphone, allowedRoles: NON_FIELD_AGENT_ROLES },
  { title: "Templates", url: "/templates", icon: FileText, allowedRoles: NON_FIELD_AGENT_ROLES },
  { title: "Forms", url: "/forms", icon: ClipboardList, allowedRoles: NON_FIELD_AGENT_ROLES },
];

const invoiceItems: SidebarItem[] = [
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Product Catalogue", url: "/invoice-products", icon: PackageSearch },
  { title: "Invoice Templates", url: "/invoice-templates", icon: LayoutTemplate, allowedRoles: ADMIN_PLUS_ROLES },
];

const analyticsItems: SidebarItem[] = [
  { title: "Targets", url: "/targets", icon: Target },
  { title: "Analytics", url: "/analytics", icon: BarChart3, allowedRoles: MANAGER_PLUS_ROLES },
];

const adminItems: SidebarItem[] = [
  { title: "Organization", url: "/organization", icon: Building2, allowedRoles: ADMIN_PLUS_ROLES },
  { title: "Users", url: "/users", icon: UserCircle, allowedRoles: ADMIN_PLUS_ROLES },
  { title: "Teams", url: "/teams", icon: UsersRound, allowedRoles: ADMIN_PLUS_ROLES },
];

const bottomItems: SidebarItem[] = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

function filterItemsByRole(items: SidebarItem[], role: string | null | undefined): SidebarItem[] {
  return items.filter((item) => hasAnyRole(role, item.allowedRoles));
}

function SidebarSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: SidebarItem[];
  collapsed: boolean;
}) {
  const location = useLocation();
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.url}
                tooltip={collapsed ? item.title : undefined}
              >
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const role = useAuthStore((s) => s.user?.role);
  const { data: unreadData } = useUnreadCount();
  const { data: reminderCountData } = useReminders({ status: "pending", limit: 1 });

  const unreadCount = unreadData?.data?.count ?? 0;
  const pendingReminderCount =
    reminderCountData?.meta?.total ??
    reminderCountData?.pagination?.total ??
    0;

  const withLiveBadges = (items: SidebarItem[]) =>
    items.map((item) => {
      if (item.url === "/reminders") {
        return { ...item, badge: pendingReminderCount > 0 ? pendingReminderCount : undefined };
      }
      if (item.url === "/notifications") {
        return { ...item, badge: unreadCount > 0 ? unreadCount : undefined };
      }
      return item;
    });

  const visibleMainItems = filterItemsByRole(withLiveBadges(mainItems), role);
  const visibleCampaignItems = filterItemsByRole(campaignItems, role);
  const visibleInvoiceItems = filterItemsByRole(invoiceItems, role);
  const visibleAnalyticsItems = filterItemsByRole(analyticsItems, role);
  const visibleAdminItems = filterItemsByRole(adminItems, role);
  const visibleBottomItems = filterItemsByRole(withLiveBadges(bottomItems), role);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground">LeadGen</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {visibleMainItems.length > 0 && <SidebarSection label="Main" items={visibleMainItems} collapsed={collapsed} />}
        {visibleCampaignItems.length > 0 && <SidebarSection label="Campaigns" items={visibleCampaignItems} collapsed={collapsed} />}
        {visibleInvoiceItems.length > 0 && <SidebarSection label="Invoices" items={visibleInvoiceItems} collapsed={collapsed} />}
        {visibleAnalyticsItems.length > 0 && <SidebarSection label="Performance" items={visibleAnalyticsItems} collapsed={collapsed} />}
        {visibleAdminItems.length > 0 && <SidebarSection label="Admin" items={visibleAdminItems} collapsed={collapsed} />}
        {visibleBottomItems.length > 0 && <SidebarSection label="Other" items={visibleBottomItems} collapsed={collapsed} />}
      </SidebarContent>
    </Sidebar>
  );
}
