import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Copy, Trash2, ToggleLeft, ToggleRight, FileText, Search,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInvoiceTemplates,
  useDeleteInvoiceTemplate,
  useDuplicateInvoiceTemplate,
  useUpdateInvoiceTemplate,
} from "@/hooks/useInvoiceTemplates";

export default function InvoiceTemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useInvoiceTemplates({ search: search || undefined });
  const deleteTemplate = useDeleteInvoiceTemplate();
  const duplicateTemplate = useDuplicateInvoiceTemplate();
  const updateTemplate = useUpdateInvoiceTemplate();

  const templates = data?.data ?? [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Design invoice forms for your agents to fill
            </p>
          </div>
          <Button onClick={() => navigate("/invoice-templates/new")}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-lg">No templates yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first invoice template to get started
              </p>
            </div>
            <Button onClick={() => navigate("/invoice-templates/new")}>
              <Plus className="h-4 w-4 mr-2" /> Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                className="group cursor-pointer hover:shadow-md transition-shadow border"
                onClick={() => navigate(`/invoice-templates/${tpl.id}/edit`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{tpl.name}</CardTitle>
                      {tpl.description && (
                        <CardDescription className="text-xs mt-0.5 line-clamp-2">
                          {tpl.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={tpl.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                      {tpl.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{tpl.fieldsCount} fields</span>
                    <span>v{tpl.version}</span>
                    {tpl.settings.currency && <span>{tpl.settings.currency}</span>}
                  </div>
                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 pt-1 border-t opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/invoice-templates/${tpl.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => duplicateTemplate.mutate(tpl.id)}
                      disabled={duplicateTemplate.isPending}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Duplicate
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        updateTemplate.mutate({ id: tpl.id, payload: { isActive: !tpl.isActive } })
                      }
                    >
                      {tpl.isActive ? (
                        <ToggleRight className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-3 w-3 mr-1" />
                      )}
                      {tpl.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive ml-auto"
                      onClick={() => setDeleteId(tpl.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Templates with invoices cannot be deleted �� deactivate
              them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteTemplate.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
