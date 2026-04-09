import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useCreateForm, useForm, useUpdateForm } from "@/hooks/useForms";
import type { FormField } from "@/api/forms";

const PALETTE = [
  { type: "text", label: "Text" },
  { type: "textarea", label: "Textarea" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "number", label: "Number" },
  { type: "location", label: "Location" },
  { type: "checkbox", label: "Checkbox" },
  { type: "dropdown", label: "Select" },
  { type: "date", label: "Date" },
  { type: "time", label: "Time" },
  { type: "datetime", label: "Date & Time" },
  { type: "paragraph", label: "FAQ" },
] as const;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const { data: formData, isLoading } = useForm(isNew ? "" : id ?? "");
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mode, setMode] = useState<"build" | "preview">("build");

  useEffect(() => {
    if (!formData?.data) return;
    setName(formData.data.name);
    setDescription(formData.data.description ?? "");
    setFields((formData.data.fields ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }, [formData]);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const addField = (type: string, label: string) => {
    const next: FormField = {
      id: uid(),
      type,
      label,
      required: type === "location" ? true : false,
      width: "full",
      order: fields.length,
      helpText:
        type === "location"
          ? "This will capture browser location and is mandatory for submission."
          : undefined,
      placeholder:
        type === "location"
          ? "Browser location will be captured automatically"
          : undefined,
      options:
        type === "dropdown" || type === "checkbox"
          ? [
              { label: "Option 1", value: "option_1" },
              { label: "Option 2", value: "option_2" },
            ]
          : undefined,
      defaultValue:
        type === "paragraph"
          ? "Q: Add your common question here\nA: Add the answer here"
          : undefined,
    };
    setFields((prev) => [...prev, next]);
    setSelectedFieldId(next.id);
  };

  const updateField = (patch: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== selectedFieldId) return f;
        const next = { ...f, ...patch };
        if (next.type === "location") {
          next.required = true;
          next.placeholder = "Browser location will be captured automatically";
        }
        return next;
      })
    );
  };

  const deleteField = (fieldId: string) => {
    setFields((prev) =>
      prev
        .filter((f) => f.id !== fieldId)
        .map((f, idx) => ({ ...f, order: idx }))
    );
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const save = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      fields: fields.map((f, idx) => ({
        ...f,
        required: f.type === "location" ? true : f.required,
        placeholder:
          f.type === "location"
            ? "Browser location will be captured automatically"
            : f.placeholder,
        order: idx,
      })),
    };

    if (isNew) {
      const res = await createForm.mutateAsync(payload);
      navigate(`/forms/${res.data.id}/edit`, { replace: true });
      return;
    }

    if (!id) return;
    await updateForm.mutateAsync({ id, payload });
  };

  const isSaving = createForm.isPending || updateForm.isPending;

  const renderPreviewField = (field: FormField) => {
    const options = field.options ?? [];

    if (field.type === "textarea") {
      return <Textarea placeholder={field.placeholder ?? ""} rows={3} disabled />;
    }
    if (field.type === "dropdown") {
      return (
        <Select disabled>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={field.placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "paragraph") {
      return (
        <div className="rounded-md border bg-muted/40 px-3 py-2 whitespace-pre-line text-sm">
          {String(field.defaultValue ?? "")}
        </div>
      );
    }
    if (field.type === "location") {
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value=""
            placeholder="Browser location will be captured at submit time"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Location access is mandatory for this field.
          </p>
        </div>
      );
    }
    if (field.type === "date" || field.type === "time" || field.type === "datetime") {
      return <Input type={field.type === "datetime" ? "datetime-local" : field.type} disabled />;
    }
    if (field.type === "number") {
      return <Input type="number" placeholder={field.placeholder ?? ""} disabled />;
    }
    if (field.type === "email") {
      return <Input type="email" placeholder={field.placeholder ?? ""} disabled />;
    }
    if (field.type === "phone") {
      return <Input type="tel" placeholder={field.placeholder ?? ""} disabled />;
    }
    return <Input type="text" placeholder={field.placeholder ?? ""} disabled />;
  };

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

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-64 border-r bg-muted/20 p-4 overflow-y-auto">
          <Button variant="ghost" size="sm" className="-ml-1 mb-3" onClick={() => navigate("/forms")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Forms
          </Button>
          <h2 className="font-semibold text-sm mb-2">Field Palette</h2>
          <div className="space-y-2">
            {PALETTE.map((item) => (
              <Button
                key={`${item.type}-${item.label}`}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addField(item.type, item.label)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-background">
            <Input
              className="max-w-xs font-medium"
              placeholder="Form name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="max-w-sm"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "build" ? "default" : "outline"}
                onClick={() => setMode("build")}
              >
                <Pencil className="h-4 w-4 mr-1" /> Build
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "preview" ? "default" : "outline"}
                onClick={() => setMode("preview")}
              >
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            </div>
            <div>
              <Button onClick={save} disabled={!name.trim() || isSaving}>
                {isSaving ? "Saving..." : "Save Form"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === "build" ? (
              <div className="max-w-2xl mx-auto space-y-2">
                {fields.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
                    Add fields from the left panel
                  </div>
                ) : (
                  fields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedFieldId === field.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{field.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {field.type}
                            {field.required ? " - required" : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="mr-2 text-xs">
                          {field.width ?? "full"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="h-2 bg-blue-500" />
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold">{name || "Untitled Form"}</h2>
                    {description ? (
                      <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No description</p>
                    )}
                  </div>
                </div>
                {fields.length === 0 ? (
                  <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                    No questions yet. Switch back to Build and add fields.
                  </div>
                ) : (
                  fields.map((field) => (
                    <div key={field.id} className="rounded-xl border bg-card p-5">
                      <div className="mb-3">
                        <p className="font-medium text-sm">
                          {field.label}
                          {field.required ? <span className="text-destructive ml-1">*</span> : null}
                        </p>
                        {field.helpText ? (
                          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                        ) : null}
                      </div>
                      {renderPreviewField(field)}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l bg-muted/20 p-4 overflow-y-auto">
          {mode === "build" && selectedField ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Field Settings</h3>
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
                  disabled={selectedField.type === "location"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Help Text</Label>
                <Textarea
                  value={selectedField.helpText ?? ""}
                  onChange={(e) => updateField({ helpText: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Width</Label>
                <Select
                  value={selectedField.width ?? "full"}
                  onValueChange={(v) => updateField({ width: v as "full" | "half" | "third" })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="half">Half</SelectItem>
                    <SelectItem value="third">Third</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <Label className="text-sm">Required</Label>
                <Switch
                  checked={selectedField.type === "location" ? true : (selectedField.required ?? false)}
                  onCheckedChange={(checked) => updateField({ required: checked })}
                  disabled={selectedField.type === "location"}
                />
              </div>
              {(selectedField.type === "dropdown" || selectedField.type === "checkbox") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Options (comma separated)</Label>
                  <Textarea
                    rows={3}
                    value={(selectedField.options ?? []).map((opt) => opt.label).join(", ")}
                    onChange={(e) =>
                      updateField({
                        options: e.target.value
                          .split(",")
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                          .map((opt, idx) => ({
                            label: opt,
                            value: `option_${idx + 1}`,
                          })),
                      })
                    }
                  />
                </div>
              )}
              {selectedField.type === "paragraph" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">FAQ Content</Label>
                  <Textarea
                    rows={4}
                    value={String(selectedField.defaultValue ?? "")}
                    onChange={(e) => updateField({ defaultValue: e.target.value })}
                  />
                </div>
              )}
            </div>
          ) : mode === "build" ? (
            <div className="text-sm text-muted-foreground">Select a field to edit its settings</div>
          ) : (
            <div className="text-sm text-muted-foreground">Preview mode is active.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
