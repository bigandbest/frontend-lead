import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; label: string }> = {
  new: { color: "bg-status-new/15 text-status-new", label: "New" },
  contacted: { color: "bg-status-contacted/15 text-status-contacted", label: "Contacted" },
  qualified: { color: "bg-status-qualified/15 text-status-qualified", label: "Qualified" },
  negotiation: { color: "bg-status-negotiation/15 text-status-negotiation", label: "Negotiation" },
  converted: { color: "bg-status-converted/15 text-status-converted", label: "Converted" },
  lost: { color: "bg-status-lost/15 text-status-lost", label: "Lost" },
  invalid: { color: "bg-status-invalid/15 text-status-invalid", label: "Invalid" },
  junk: { color: "bg-status-junk/15 text-status-junk", label: "Junk" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-priority-low/15 text-priority-low", label: "Low" },
  medium: { color: "bg-priority-medium/15 text-priority-medium", label: "Medium" },
  high: { color: "bg-priority-high/15 text-priority-high", label: "High" },
  urgent: { color: "bg-priority-urgent/15 text-priority-urgent", label: "Urgent" },
};

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const config = statusConfig[status] || { color: "bg-muted text-muted-foreground", label: status };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      config.color,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, size = "md" }: { priority: string; size?: "sm" | "md" }) {
  const config = priorityConfig[priority] || { color: "bg-muted text-muted-foreground", label: priority };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      config.color,
    )}>
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const roleMap: Record<string, string> = {
    admin: "bg-primary/15 text-primary",
    field_agent: "bg-success/15 text-success",
    marketing_agent: "bg-info/15 text-info",
    agent_supervisor: "bg-warning/15 text-warning",
    marketing_manager: "bg-info/15 text-info",
    super_admin: "bg-primary/15 text-primary",
  };
  const label = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
      roleMap[role] || "bg-muted text-muted-foreground",
    )}>
      {label}
    </span>
  );
}
