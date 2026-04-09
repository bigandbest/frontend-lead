import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { type ReactNode, isValidElement, createElement } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon | ReactNode;
  onClick?: () => void;
}

export function StatCard({ title, value, trend, trendLabel, icon, onClick }: StatCardProps) {
  const isPositive = trend && trend > 0;

  // Lucide icons are forwardRef objects with $$typeof + render, not plain functions
  const isComponent = typeof icon === "function" || (typeof icon === "object" && icon !== null && !isValidElement(icon) && "$$typeof" in (icon as any));

  return (
    <div className="stat-card" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              isPositive ? "text-success" : "text-destructive",
            )}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend)}% {trendLabel || "vs last period"}
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {isComponent ? createElement(icon as LucideIcon, { className: "h-5 w-5 text-primary" }) : (icon as ReactNode)}
        </div>
      </div>
    </div>
  );
}
