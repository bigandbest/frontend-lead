import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GripVertical, Plus, Trash2, ChevronLeft, Settings2, Eye,
  Type, Hash, Mail, Phone, MapPin, List, AlignLeft, Calendar,
  Percent, DollarSign, StickyNote, Tag,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInvoiceTemplate,
  useCreateInvoiceTemplate,
  useUpdateInvoiceTemplate,
} from "@/hooks/useInvoiceTemplates";
import type { InvoiceTemplateField, InvoiceTemplateSettings, InvoiceFieldRole } from "@/api/invoice-templates";

// ─── Field palette ────────────────────────────────────────────────────────────

interface FieldPaletteItem {
  role: InvoiceFieldRole;
  type: string;
  label: string;
  icon: React.ElementType;
  isCustomerField?: boolean;
  isMarketingRelevant?: boolean;
  isPricingField?: boolean;
  section: "customer" | "pricing" | "custom";
}

const FIELD_PALETTE: FieldPaletteItem[] = [
  { role: "customer_name",    type: "text",   label: "Customer Name",    icon: Type,       isCustomerField: true, isMarketingRelevant: true,  section: "customer" },
  { role: "customer_email",   type: "email",  label: "Customer Email",   icon: Mail,       isCustomerField: true, isMarketingRelevant: true,  section: "customer" },
  { role: "customer_phone",   type: "phone",  label: "Customer Phone",   icon: Phone,      isCustomerField: true, isMarketingRelevant: true,  section: "customer" },
  { role: "customer_address", type: "text",   label: "Address",          icon: MapPin,     isCustomerField: true, isMarketingRelevant: false, section: "customer" },
  { role: "customer_city",    type: "text",   label: "City",             icon: MapPin,     isCustomerField: true, isMarketingRelevant: true,  section: "customer" },
  { role: "customer_state",   type: "text",   label: "State",            icon: MapPin,     isCustomerField: true, isMarketingRelevant: true,  section: "customer" },
  { role: "customer_pincode", type: "text",   label: "Pincode",          icon: Hash,       isCustomerField: true, isMarketingRelevant: false, section: "customer" },
  { role: "line_item_description", type: "text",   label: "Item Description", icon: AlignLeft,  isPricingField: true, section: "pricing" },
  { role: "line_item_quantity",    type: "number", label: "Quantity",         icon: Hash,       isPricingField: true, section: "pricing" },
  { role: "line_item_unit_price",  type: "number", label: "Unit Price",       icon: DollarSign, isPricingField: true, section: "pricing" },
  { role: "notes",    type: "textarea", label: "Notes",    icon: StickyNote, section: "custom" },
  { role: "custom",   type: "text",     label: "Custom Field", icon: Tag,    section: "custom" },
  { role: "custom",   type: "dropdown", label: "Dropdown",     icon: List,   section: "custom" },
  { role: "custom",   type: "date",     label: "Date",         icon: Calendar, section: "custom" },
  { role: "custom",   type: "number",   label: "Number",       icon: Hash,   section: "custom" },
];

// ─── Unique ID helper ─────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Field Row Component ──────────────────────────────────────────────────────

function FieldRow({
  field,
  selected,
  onSelect,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  field: InvoiceTemplateField;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const palette = FIELD_PALETTE.find((p) => p.role === field.role && p.type === field.type)
    ?? FIELD_PALETTE.find((p) => p.role === field.role)
    ?? FIELD_PALETTE.find((p) => p.type === field.type);
  const Icon = palette?.icon ?? Tag;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(e); }}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none
        ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"}`}
      onClick={onSelect}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 cursor-grab" />
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground">{field.type} · {field.role}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {field.required && <Badge variant="outline" className="text-xs px-1.5 py-0">Required</Badge>}
        {field.isMarketingRelevant && <Badge variant="secondary" className="text-xs px-1.5 py-0">Mkt</Badge>}
        <Button
          size="sm" variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoiceBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const { data: templateData, isLoading } = useInvoiceTemplate(isNew ? "" : id ?? "");
  const createTemplate = useCreateInvoiceTemplate();
  const updateTemplate = useUpdateInvoiceTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<InvoiceTemplateField[]>([]);
  const [settings, setSettings] = useState<InvoiceTemplateSettings>({
    currency: "INR",
    defaultTaxRate: 18,
    discountEnabled: true,
    lineItemsEnabled: true,
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragSourceIdx, setDragSourceIdx] = useState<number | null>(null);
  const [tab, setTab] = useState<"fields" | "settings">("fields");

  useEffect(() => {
    if (templateData?.data) {
      const t = templateData.data;
      setName(t.name);
      setDescription(t.description ?? "");
      setFields(t.fields);
      setSettings(t.settings ?? {});
    }
  }, [templateData]);

  // ─── Drag and Drop ──────────────────────────────────────────────────────────

  const handleFieldDrop = useCallback(
    (targetIdx: number) => {
      if (dragSourceIdx === null || dragSourceIdx === targetIdx) return;
      setFields((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragSourceIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next.map((f, i) => ({ ...f, order: i }));
      });
      setDragSourceIdx(null);
    },
    [dragSourceIdx]
  );

  // ─── Add field from palette ─────────────────────────────────────────────────

  const addField = (item: FieldPaletteItem) => {
    const newField: InvoiceTemplateField = {
      id: uid(),
      role: item.role,
      type: item.type,
      label: item.label,
      required: item.isCustomerField ? true : false,
      isCustomerField: item.isCustomerField,
      isMarketingRelevant: item.isMarketingRelevant,
      isPricingField: item.isPricingField,
      order: fields.length,
      width: "full",
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  // ─── Selected field editor ──────────────────────────────────────────────────

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const updateField = (patch: Partial<InvoiceTemplateField>) => {
    setFields((prev) => prev.map((f) => (f.id === selectedFieldId ? { ...f, ...patch } : f)));
  };

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      fields,
      settings,
    };

    if (isNew) {
      const res = await createTemplate.mutateAsync(payload);
      navigate(`/invoice-templates/${res.data.id}/edit`, { replace: true });
    } else {
      if (!id) return;
      await updateTemplate.mutateAsync({ id, payload });
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  if (!isNew && isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const customerFields = FIELD_PALETTE.filter((p) => p.section === "customer");
  const pricingFields  = FIELD_PALETTE.filter((p) => p.section === "pricing");
  const customFields   = FIELD_PALETTE.filter((p) => p.section === "custom");

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* ── Left Panel: Field Palette ── */}
        <div className="w-64 border-r bg-muted/20 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b">
            <Button
              variant="ghost" size="sm"
              className="mb-3 -ml-1 text-muted-foreground"
              onClick={() => navigate("/invoice-templates")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Templates
            </Button>
            <h2 className="font-semibold text-sm">Field Palette</h2>
            <p className="text-xs text-muted-foreground">Drag or click to add fields</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <Section label="Customer Info" items={customerFields} onAdd={addField} />
            <Section label="Line Items" items={pricingFields} onAdd={addField} />
            <Section label="Custom" items={customFields} onAdd={addField} />
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-background">
            <Input
              className="max-w-xs font-medium border-transparent focus:border-input"
              placeholder="Template name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">/</span>
            <Input
              className="max-w-sm text-sm border-transparent focus:border-input text-muted-foreground"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => navigate(`/invoices/new?template=${id}`)}
                disabled={isNew}
              >
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? "Saving…" : "Save Template"}
              </Button>
            </div>
          </div>

          {/* Canvas body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-2">
              {fields.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Add fields from the palette on the left</p>
                </div>
              ) : (
                fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, idx) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      selected={selectedFieldId === field.id}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onDelete={() => {
                        setFields((prev) => prev.filter((f) => f.id !== field.id).map((f, i) => ({ ...f, order: i })));
                        if (selectedFieldId === field.id) setSelectedFieldId(null);
                      }}
                      onDragStart={() => setDragSourceIdx(idx)}
                      onDragOver={() => {}}
                      onDrop={() => handleFieldDrop(idx)}
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Field Editor / Settings ── */}
        <div className="w-72 border-l bg-muted/20 flex flex-col overflow-hidden shrink-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "fields" | "settings")}>
            <TabsList className="w-full rounded-none border-b h-10">
              <TabsTrigger value="fields" className="flex-1 rounded-none">
                <Type className="h-3.5 w-3.5 mr-1.5" /> Field
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 rounded-none">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* Field editor panel */}
            <TabsContent value="fields" className="m-0 flex-1 overflow-y-auto">
              {selectedField ? (
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedField.label}
                      onChange={(e) => updateField({ label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={selectedField.placeholder ?? ""}
                      onChange={(e) => updateField({ placeholder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Help text</Label>
                    <Input
                      value={selectedField.helpText ?? ""}
                      onChange={(e) => updateField({ helpText: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Width</Label>
                    <Select
                      value={selectedField.width ?? "full"}
                      onValueChange={(v) => updateField({ width: v as "full" | "half" | "third" })}
                    >
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="half">Half</SelectItem>
                        <SelectItem value="third">Third</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <ToggleRow
                      label="Required"
                      checked={selectedField.required ?? false}
                      onChange={(v) => updateField({ required: v })}
                    />
                    <ToggleRow
                      label="Marketing relevant"
                      description="Email campaigns & segmentation"
                      checked={selectedField.isMarketingRelevant ?? false}
                      onChange={(v) => updateField({ isMarketingRelevant: v })}
                    />
                    <ToggleRow
                      label="Customer field"
                      description="Stored in customer profile"
                      checked={selectedField.isCustomerField ?? false}
                      onChange={(v) => updateField({ isCustomerField: v })}
                    />
                    <ToggleRow
                      label="Pricing field"
                      description="Used in invoice totals"
                      checked={selectedField.isPricingField ?? false}
                      onChange={(v) => updateField({ isPricingField: v })}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm py-16">
                  Select a field to edit its properties
                </div>
              )}
            </TabsContent>

            {/* Template settings panel */}
            <TabsContent value="settings" className="m-0 flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <Select
                  value={settings.currency ?? "INR"}
                  onValueChange={(v) => setSettings((s) => ({ ...s, currency: v }))}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Default tax rate (%)</Label>
                <Input
                  type="number" min={0} max={100}
                  value={settings.defaultTaxRate ?? 0}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultTaxRate: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company name</Label>
                <Input
                  value={settings.companyName ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company address</Label>
                <Textarea
                  value={settings.companyAddress ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, companyAddress: e.target.value }))}
                  rows={3} className="text-sm resize-none"
                />
              </div>
              <Separator />
              <ToggleRow
                label="Discount enabled"
                checked={settings.discountEnabled ?? false}
                onChange={(v) => setSettings((s) => ({ ...s, discountEnabled: v }))}
              />
              <ToggleRow
                label="Multiple line items"
                description="Agents can add more than one product"
                checked={settings.lineItemsEnabled ?? true}
                onChange={(v) => setSettings((s) => ({ ...s, lineItemsEnabled: v }))}
              />
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs">Terms & Conditions</Label>
                <Textarea
                  value={settings.termsAndConditions ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, termsAndConditions: e.target.value }))}
                  rows={4} className="text-sm resize-none"
                  placeholder="Payment terms, conditions…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment instructions</Label>
                <Textarea
                  value={settings.paymentInstructions ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, paymentInstructions: e.target.value }))}
                  rows={3} className="text-sm resize-none"
                  placeholder="Bank details, UPI, etc."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────���───

function Section({
  label,
  items,
  onAdd,
}: {
  label: string;
  items: FieldPaletteItem[];
  onAdd: (item: FieldPaletteItem) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={`${item.role}-${item.type}`}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left"
              onClick={() => onAdd(item)}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{item.label}</span>
              <Plus className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}
