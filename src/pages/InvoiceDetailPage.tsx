import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Printer, CheckCircle2, Clock, XCircle,
  User, Phone, Mail, MapPin, Calendar, FileText, Tag, Receipt,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useInvoice, useUpdateInvoice, useUpdateCustomerTags } from "@/hooks/useInvoices";
import { useInvoiceTemplate } from "@/hooks/useInvoiceTemplates";
import { ThermalReceiptView } from "@/components/shared/ThermalReceiptView";
import type { InvoiceStatus } from "@/api/invoices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "bg-gray-100 text-gray-700",    icon: FileText },
  issued:    { label: "Issued",    color: "bg-blue-100 text-blue-700",    icon: Clock },
  paid:      { label: "Paid",      color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  overdue:   { label: "Overdue",   color: "bg-red-100 text-red-700",      icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500",    icon: XCircle },
  void:      { label: "Void",      color: "bg-gray-100 text-gray-400",    icon: XCircle },
};

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
    #invoice-print-area {
      position: fixed; top: 0; left: 0; width: 100%;
      display: flex; justify-content: center;
    }
    .thermal-receipt { margin: 0 auto; }
    .no-print { display: none !important; }
  }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useInvoice(id!);
  const updateInvoice = useUpdateInvoice();
  const updateTags = useUpdateCustomerTags();

  const [tagInput, setTagInput] = useState("");
  const [viewMode, setViewMode] = useState<"standard" | "thermal">("standard");

  const invoice = data?.data;
  const customer = invoice?.customer;

  const { data: templateData } = useInvoiceTemplate(invoice?.templateId ?? "");
  const templateSettings = templateData?.data?.settings;

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    if (!invoice) return;
    const patch: Record<string, unknown> = { status };
    if (status === "paid") patch.paidAt = new Date().toISOString();
    updateInvoice.mutate({ id: invoice.id, payload: patch as any });
  };

  const addTag = () => {
    if (!tagInput.trim() || !customer) return;
    const existing = customer.tags ?? [];
    if (existing.includes(tagInput.trim())) return;
    updateTags.mutate({ id: customer.id, tags: [...existing, tagInput.trim()] });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    if (!customer) return;
    updateTags.mutate({ id: customer.id, tags: customer.tags.filter((t) => t !== tag) });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="p-6 text-center py-24 text-muted-foreground">
          Invoice not found
        </div>
      </AppLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.issued;
  const StatusIcon = statusCfg.icon;

  const canChangeStatus = invoice.status !== "void" && invoice.status !== "cancelled";
  const cgstAmount = invoice.taxAmount / 2;
  const sgstAmount = invoice.taxAmount / 2;

  return (
    <AppLayout>
      <style>{PRINT_STYLES}</style>

      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header bar */}
        <div className="flex flex-col gap-3 no-print">
          {/* Top row: back + title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Invoices
            </Button>
            <div>
              <h1 className="font-bold text-lg sm:text-xl font-mono">{invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Created by {invoice.createdByName} · {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>
          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2">
            {canChangeStatus && (
              <Select value={invoice.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["draft", "issued", "paid", "overdue", "cancelled"] as InvoiceStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant={viewMode === "thermal" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode((m) => (m === "thermal" ? "standard" : "thermal"))}
              title={viewMode === "thermal" ? "Switch to Standard View" : "Switch to Thermal Receipt"}
            >
              <Receipt className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{viewMode === "thermal" ? "Thermal Receipt" : "Standard View"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* ── Printable Invoice Document ── */}
        <div id="invoice-print-area" ref={printRef}>
          {/* ── Thermal Receipt View ── */}
          {viewMode === "thermal" ? (
            <div className="flex justify-center">
              <ThermalReceiptView invoice={invoice} templateSettings={templateSettings} />
            </div>
          ) : (
          <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Invoice Top */}
            <div className="p-4 sm:p-8 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Company info */}
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">BIG & BEST MART (OPC) PVT LTD</h2>
                  <p className="text-muted-foreground text-xs mt-1">
                    37/1, Central Road, K B Sarani, Uttapara, Madhyamgram, North 24 Parganas, Barasat - II, West Bengal, India, 700129
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">+91 7059911480</p>
                  <p className="text-muted-foreground text-xs mt-0.5">bigandbestmart@gmail.com</p>
                  <p className="text-muted-foreground text-sm mt-1 font-mono">{invoice.invoiceNumber}</p>
                </div>
                {/* Status badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusCfg.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusCfg.label}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Billing info row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Bill To */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Bill To
                  </p>
                  <p className="font-semibold">
                    {customer?.firstName}{customer?.lastName ? " " + customer.lastName : ""}
                  </p>
                  {customer?.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {customer.email}
                    </p>
                  )}
                  {customer?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {customer.phone}
                    </p>
                  )}
                  {(customer?.address || customer?.city) && (
                    <p className="text-sm text-muted-foreground flex items-start gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        {[customer.address, customer.city, customer.state, customer.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Invoice Dates */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Invoice Details
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Issue date:</span>
                      <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Due date:</span>
                        <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                      </div>
                    )}
                    {invoice.paidAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-muted-foreground">Paid on:</span>
                        <span className="font-medium text-green-700">{formatDate(invoice.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Template
                  </p>
                  <p className="text-sm">{invoice.templateName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created by {invoice.createdByName}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="px-4 sm:px-8 pb-4 sm:pb-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[500px] px-4 sm:px-0">
                <thead>
                  <tr className="border-b-2 border-foreground/20">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Description</th>
                    <th className="text-center py-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">HSN</th>
                    <th className="text-center py-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Qty</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Unit Price</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Disc%</th>
                    <th className="text-right py-2 pl-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{li.description}</td>
                      <td className="py-3 px-2 text-center text-muted-foreground">{li.hsnCode ?? "—"}</td>
                      <td className="py-3 px-2 text-center text-muted-foreground">{li.quantity}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {formatCurrency(li.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {li.discountPct > 0 ? `${li.discountPct}%` : "—"}
                      </td>
                      <td className="py-3 pl-2 text-right font-medium">
                        {formatCurrency(li.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-4">
                <div className="w-full sm:w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST</span>
                        <span>{formatCurrency(cgstAmount, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST</span>
                        <span>{formatCurrency(sgstAmount, invoice.currency)}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total ({invoice.currency})</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="px-4 sm:px-8 pb-4 sm:pb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-sm text-muted-foreground border rounded p-3 bg-muted/30">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 sm:px-8 pb-8 text-center mt-4 border-t pt-8 mx-4 sm:mx-8">
              <p className="font-bold text-foreground">Thank You for your business!</p>
              <p className="text-sm text-muted-foreground mt-1">www.bigbestmart.com</p>
            </div>
          </div>
          )}
        </div>

        {/* ── Location Card (no-print) ── */}
        {invoice.locationAddress && (
          <Card className="no-print">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Invoice Location</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-muted/40 border rounded-lg px-3 py-2 flex-1">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{invoice.locationAddress}</p>
                    {invoice.latitude != null && invoice.longitude != null && (
                      <p className="text-xs text-muted-foreground font-mono">{invoice.latitude.toFixed(5)}, {invoice.longitude.toFixed(5)}</p>
                    )}
                  </div>
                </div>
                {invoice.latitude != null && invoice.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${invoice.latitude},${invoice.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
                  >
                    View on Maps
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Customer Profile Card (no-print) ── */}
        {customer && (
          <Card className="no-print">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Customer Profile</span>
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => navigate(`/invoices/customers/${customer.id}`)}
                >
                  <span className="hidden sm:inline">View Full Profile</span>
                  <span className="sm:hidden">Profile</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <p className="font-semibold">{formatCurrency(customer.totalSpend, invoice.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <p className="font-semibold">{customer.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Invoice</p>
                  <p className="font-semibold">{formatDate(customer.lastInvoiceAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Value</p>
                  <p className="font-semibold">
                    {customer.invoiceCount > 0
                      ? formatCurrency(customer.totalSpend / customer.invoiceCount, invoice.currency)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Marketing Tags */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Marketing Tags
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {(customer.tags ?? []).map((tag) => (
                    <Badge
                      key={tag} variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add tag…"
                      className="h-6 text-xs border rounded px-2 w-24 outline-none focus:ring-1 ring-primary"
                    />
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addTag}>
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
