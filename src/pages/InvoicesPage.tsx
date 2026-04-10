import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Receipt, TrendingUp, DollarSign, Clock, CheckCircle2, XCircle,
  Filter, Download, MapPin,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useInvoices, useInvoiceStats, useExportInvoices } from "@/hooks/useInvoices";
import type { InvoiceStatus } from "@/api/invoices";
import { useAuthStore } from "@/stores/authStore";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "Draft",     variant: "secondary" },
  issued:    { label: "Issued",    variant: "default" },
  paid:      { label: "Paid",      variant: "default" },
  overdue:   { label: "Overdue",   variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
  void:      { label: "Void",      variant: "outline" },
};

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser && ["super_admin", "admin", "marketing_manager", "agent_supervisor"].includes(currentUser.role);

  const { data, isLoading } = useInvoices({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter as InvoiceStatus : undefined,
    page,
    limit: 20,
  });

  const { data: statsData } = useInvoiceStats();
  const exportInvoices = useExportInvoices();

  const stats = statsData?.data;
  const invoices = data?.data ?? [];
  const pagination = data?.pagination;

  const handleExport = () => {
    exportInvoices.mutate({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter as InvoiceStatus : undefined,
    });
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1 hidden sm:block">Create and manage customer invoices</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportInvoices.isPending || !invoices.length}
              title={invoices.length === 0 ? "No invoices to export" : "Export invoices to Excel"}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" onClick={() => navigate("/invoices/new")}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Invoices"
              value={String(stats.total)}
              icon={Receipt}
              color="blue"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Paid"
              value={formatCurrency(stats.paidRevenue)}
              icon={CheckCircle2}
              color="emerald"
              sub={`${stats.byStatus.paid ?? 0} invoices`}
            />
            <StatCard
              title="Pending"
              value={formatCurrency(stats.pendingRevenue)}
              icon={Clock}
              color="amber"
              sub={`This month: ${stats.thisMonthCount}`}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by number, customer…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Template</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                {isAdmin && <TableHead className="hidden lg:table-cell">Location</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isAdmin ? 7 : 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-16 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const statusCfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.issued;
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{inv.customerName}</p>
                          {inv.customerEmail && (
                            <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                          )}
                          <p className="text-xs text-muted-foreground sm:hidden">{formatDate(inv.invoiceDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {inv.templateName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{formatDate(inv.invoiceDate)}</TableCell>
                      {isAdmin && (
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[180px]">
                          {inv.locationAddress ? (
                            <span className="flex items-center gap-1 truncate" title={inv.locationAddress}>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{inv.locationAddress}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.total, inv.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  title, value, icon: Icon, color, sub,
}: {
  title: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color] ?? colorMap.blue}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="font-bold text-lg leading-tight truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
