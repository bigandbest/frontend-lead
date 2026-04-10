import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ChevronLeft, MapPin, Loader2 as Spinner } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useInvoiceTemplates, useInvoiceTemplate } from "@/hooks/useInvoiceTemplates";
import { useCreateInvoice, useInvoiceProducts } from "@/hooks/useInvoices";
import type { InvoiceTemplateField, InvoiceTemplateSettings } from "@/api/invoice-templates";
import type { CreateLineItemInput } from "@/api/invoices";

// ─── Line Item Row ────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  productId: string;
  description: string;
  hsn: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxRatePct: number;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function calcLineAmount(li: LineItem) {
  const base = li.quantity * li.unitPrice;
  const afterDiscount = base * (1 - li.discountPct / 100);
  return afterDiscount * (1 + li.taxRatePct / 100);
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

// ─── Dynamic Field Renderer ───────────────────────────────────────────────────

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: InvoiceTemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strVal = String(value ?? "");

  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="text-sm resize-none"
        required={field.required}
      />
    );
  }

  if (field.type === "dropdown" && field.options && field.options.length > 0) {
    return (
      <Select value={strVal} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={field.placeholder ?? "Select…"} /></SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={field.id}
      type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      className="h-9 text-sm"
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoiceFillPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTemplate = searchParams.get("template") ?? "";

  const [selectedTemplateId, setSelectedTemplateId] = useState(preselectedTemplate);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: uid(), productId: "", description: "", hsn: "", quantity: 1, unitPrice: 0, discountPct: 0, taxRatePct: 0 },
  ]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");

  const { data: templatesData } = useInvoiceTemplates({ isActive: true });
  const { data: templateDetail, isLoading: templateLoading } = useInvoiceTemplate(selectedTemplateId);
  const { data: productCatalogData } = useInvoiceProducts({ limit: 300, isActive: true });
  const createInvoice = useCreateInvoice();

  const template = templateDetail?.data;
  const settings: InvoiceTemplateSettings = template?.settings ?? {};
  const productCatalog = productCatalogData?.data ?? [];
  const currency = settings.currency ?? "INR";
  const defaultTaxRate = settings.defaultTaxRate ?? 0;

  // Apply default tax rate to new line items
  useEffect(() => {
    if (defaultTaxRate > 0) {
      setLineItems((prev) =>
        prev.map((li) => (li.taxRatePct === 0 ? { ...li, taxRatePct: defaultTaxRate } : li))
      );
    }
  }, [defaultTaxRate]);

  // Separate customer fields vs custom fields
  const customerFields = useMemo(
    () => (template?.fields ?? []).filter((f) => f.isCustomerField).sort((a, b) => a.order - b.order),
    [template]
  );
  const otherFields = useMemo(
    () =>
      (template?.fields ?? [])
        .filter((f) => !f.isCustomerField && !f.isPricingField && f.role !== "notes")
        .sort((a, b) => a.order - b.order),
    [template]
  );

  // ─── Totals ─────────────────────────────────────────────────────────────────

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = lineItems.reduce((s, li) => {
    const base = li.quantity * li.unitPrice * (1 - li.discountPct / 100);
    return s + base * (li.taxRatePct / 100);
  }, 0);
  const discountFromLines = lineItems.reduce(
    (s, li) => s + li.quantity * li.unitPrice * (li.discountPct / 100), 0
  );
  const total = subtotal - discountFromLines - globalDiscount + taxAmount;

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          const parts = [
            a.neighbourhood || a.suburb || a.village || a.town,
            a.city || a.county || a.district,
            a.state,
          ].filter(Boolean);
          const address = parts.length > 0 ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setLocation({ lat, lng, address });
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
        setLocationStatus("idle");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) return;
    if (!location) {
      setLocationStatus("error");
      return;
    }

    // Build customer object from customer fields
    const fieldMap = (template?.fields ?? []).reduce<Record<string, InvoiceTemplateField>>((m, f) => {
      m[f.id] = f;
      return m;
    }, {});

    const customerPayload: Record<string, unknown> = {};
    for (const [fid, val] of Object.entries(fieldValues)) {
      const field = fieldMap[fid];
      if (!field) continue;
      if (field.role === "customer_name") {
        const parts = String(val).trim().split(" ");
        customerPayload.firstName = parts[0] ?? "";
        customerPayload.lastName = parts.slice(1).join(" ") || undefined;
      }
      if (field.role === "customer_email") customerPayload.email = val;
      if (field.role === "customer_phone") customerPayload.phone = val;
      if (field.role === "customer_address") customerPayload.address = val;
      if (field.role === "customer_city") customerPayload.city = val;
      if (field.role === "customer_state") customerPayload.state = val;
      if (field.role === "customer_pincode") customerPayload.pincode = val;
    }

    const liPayload: (CreateLineItemInput & { metadata?: Record<string, unknown> })[] = lineItems.map((li, idx) => ({
      description: li.description,
      productId: li.productId || undefined,
      hsnCode: li.hsn || undefined,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discountPct: li.discountPct,
      taxRatePct: li.taxRatePct,
      order: idx,
    }));

    const res = await createInvoice.mutateAsync({
      templateId: selectedTemplateId,
      customer: {
        firstName: String(customerPayload.firstName ?? "Customer"),
        ...customerPayload as any,
      },
      lineItems: liPayload,
      discount: globalDiscount,
      notes: notes || undefined,
      dueDate: dueDate || undefined,
      formData: fieldValues,
      latitude: location!.lat,
      longitude: location!.lng,
      locationAddress: location!.address,
    });

    navigate(`/invoices/${res.data.id}`);
  };

  const applyCatalogProductToRow = (rowId: string, productId: string) => {
    if (productId === "manual") {
      setLineItems((prev) =>
        prev.map((x) => (x.id === rowId ? { ...x, productId: "" } : x))
      );
      return;
    }

    const product = productCatalog.find((p) => p.id === productId);
    if (!product) return;

    setLineItems((prev) =>
      prev.map((x) =>
        x.id === rowId
          ? {
              ...x,
              productId: product.id,
              description: product.name,
              hsn: product.hsnCode,
              unitPrice: product.unitPrice,
              taxRatePct: product.taxRatePct ?? 0,
            }
          : x
      )
    );
  };

  return (
    <AppLayout>
      <form onSubmit={handleSubmit}>
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Invoices
            </Button>
            <div>
              <h1 className="text-xl font-bold">New Invoice</h1>
              <p className="text-muted-foreground text-sm">Fill in customer and product details</p>
            </div>
          </div>

          {/* Template Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Select Invoice Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choose a template…" />
                </SelectTrigger>
                <SelectContent>
                  {(templatesData?.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.settings.currency && (
                        <span className="text-muted-foreground ml-2 text-xs">· {t.settings.currency}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedTemplateId && (
            <>
              {templateLoading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : (
                <>
                  {/* Customer Details */}
                  {customerFields.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">2. Customer Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customerFields.map((field) => (
                            <div
                              key={field.id}
                              className={field.width === "full" ? "md:col-span-2" : ""}
                            >
                              <Label htmlFor={field.id} className="text-sm mb-1.5 flex items-center gap-1.5">
                                {field.label}
                                {field.required && <span className="text-destructive">*</span>}
                                {field.isMarketingRelevant && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">Marketing</Badge>
                                )}
                              </Label>
                              <DynamicField
                                field={field}
                                value={fieldValues[field.id] ?? ""}
                                onChange={(v) => setFieldValues((prev) => ({ ...prev, [field.id]: v }))}
                              />
                              {field.helpText && (
                                <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Line Items */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">3. Products / Services</CardTitle>
                        {settings.lineItemsEnabled !== false && (
                          <Button
                            type="button"
                            size="sm" variant="outline"
                            onClick={() =>
                              setLineItems((prev) => [
                                ...prev,
                                { id: uid(), productId: "", description: "", hsn: "", quantity: 1, unitPrice: 0, discountPct: 0, taxRatePct: defaultTaxRate },
                              ])
                            }
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                        <span className="col-span-3">Saved Product</span>
                        <span className="col-span-3">Description</span>
                        <span className="col-span-1 text-center">HSN</span>
                        <span className="col-span-1 text-center">Qty</span>
                        <span className="col-span-1 text-center">Unit Price</span>
                        <span className="col-span-1 text-center">Disc%</span>
                        <span className="col-span-1 text-center">Tax%</span>
                        <span className="col-span-2 text-right">Amount</span>
                      </div>
                      {lineItems.map((li) => (
                        <div key={li.id} className="grid grid-cols-12 gap-2 items-center">
                          <Select
                            value={li.productId || "manual"}
                            onValueChange={(value) => applyCatalogProductToRow(li.id, value)}
                          >
                            <SelectTrigger className="col-span-3 h-8 text-xs">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual entry</SelectItem>
                              {productCatalog.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.hsnCode}) · {(product.taxRatePct ?? 0).toFixed(2)}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            className="col-span-3 h-8 text-sm"
                            placeholder="Description"
                            value={li.description}
                            required
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, description: e.target.value } : x))
                              )
                            }
                          />
                          <Input
                            className="col-span-1 h-8 text-sm text-center"
                            placeholder="HSN"
                            value={li.hsn}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, hsn: e.target.value } : x))
                              )
                            }
                          />
                          <Input
                            type="number" min={0.01} step={0.01}
                            className="col-span-1 h-8 text-sm text-center"
                            value={li.quantity}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, quantity: Number(e.target.value) } : x))
                              )
                            }
                          />
                          <Input
                            type="number" min={0} step={0.01}
                            className="col-span-1 h-8 text-sm text-center"
                            value={li.unitPrice}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, unitPrice: Number(e.target.value) } : x))
                              )
                            }
                          />
                          <Input
                            type="number" min={0} max={100}
                            className="col-span-1 h-8 text-sm text-center"
                            value={li.discountPct}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, discountPct: Number(e.target.value) } : x))
                              )
                            }
                          />
                          <Input
                            type="number" min={0} max={100}
                            className="col-span-1 h-8 text-sm text-center"
                            value={li.taxRatePct}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x) => (x.id === li.id ? { ...x, taxRatePct: Number(e.target.value) } : x))
                              )
                            }
                          />
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <span className="text-sm font-medium">{formatCurrency(calcLineAmount(li), currency)}</span>
                            {lineItems.length > 1 && (
                              <Button
                                type="button" size="sm" variant="ghost"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setLineItems((prev) => prev.filter((x) => x.id !== li.id))
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Totals */}
                      <Separator className="my-3" />
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(subtotal, currency)}</span>
                          </div>
                          {discountFromLines > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Line discounts</span>
                              <span>-{formatCurrency(discountFromLines, currency)}</span>
                            </div>
                          )}
                          {settings.discountEnabled && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Extra discount</span>
                              <Input
                                type="number" min={0} step={0.01}
                                value={globalDiscount}
                                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                className="h-7 w-24 text-right text-sm"
                              />
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span>{formatCurrency(taxAmount, currency)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span>{formatCurrency(total, currency)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Other custom fields */}
                  {otherFields.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">4. Additional Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {otherFields.map((field) => (
                            <div key={field.id} className={field.width === "full" ? "md:col-span-2" : ""}>
                              <Label htmlFor={field.id} className="text-sm mb-1.5">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </Label>
                              <DynamicField
                                field={field}
                                value={fieldValues[field.id] ?? ""}
                                onChange={(v) => setFieldValues((prev) => ({ ...prev, [field.id]: v }))}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Location */}
                  <Card className={locationStatus === "error" && !location ? "border-destructive" : ""}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {otherFields.length > 0 ? "5." : "4."} Location <span className="text-destructive">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {location ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="font-medium">{location.address}</p>
                              <p className="text-xs text-green-600/70 font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                            </div>
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={captureLocation}>
                            Recapture
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={captureLocation}
                            disabled={locationStatus === "loading"}
                            className={locationStatus === "error" ? "border-destructive text-destructive" : ""}
                          >
                            {locationStatus === "loading" ? (
                              <><Spinner className="h-4 w-4 mr-2 animate-spin" />Getting location…</>
                            ) : (
                              <><MapPin className="h-4 w-4 mr-2" />Capture Current Location</>
                            )}
                          </Button>
                          {locationStatus === "error" && (
                            <p className="text-xs text-destructive">
                              {location === null
                                ? "Location is required to create an invoice. Please allow location access."
                                : "Could not get location. Please try again or check browser permissions."}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes & Due Date */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{otherFields.length > 0 ? "6." : "5."} Notes & Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Notes (optional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Payment notes, special instructions…"
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Due Date (optional)</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                        {settings.termsAndConditions && (
                          <p className="text-xs text-muted-foreground border rounded p-2 mt-2 leading-relaxed">
                            {settings.termsAndConditions}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit */}
                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
                      Cancel
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Invoice Total</p>
                        <p className="font-bold text-lg">{formatCurrency(total, currency)}</p>
                      </div>
                      <Button type="submit" disabled={createInvoice.isPending || !location} size="lg" title={!location ? "Capture location first" : undefined}>
                        {createInvoice.isPending ? "Creating…" : "Create Invoice"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </AppLayout>
  );
}
