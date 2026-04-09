import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Copy, Trash2 } from "lucide-react";
import { useForms, useTogglePublish, useDeleteForm, useDuplicateForm } from "@/hooks/useForms";

export default function FormsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"published" | "draft" | "all">("all");

  const { data: formsData, isLoading } = useForms({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  });

  const togglePublish = useTogglePublish();
  const deleteFormMutation = useDeleteForm();
  const duplicateFormMutation = useDuplicateForm();

  const forms = formsData?.data ?? [];
  const publishedCount = forms.filter((f) => f.isPublished).length;
  const draftCount = forms.filter((f) => !f.isPublished).length;

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      deleteFormMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateFormMutation.mutate(id);
  };

  const handleTogglePublish = (id: string) => {
    togglePublish.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Forms</h1>
          {formsData && <p className="text-sm text-muted-foreground mt-1">{formsData.pagination?.total ?? 0} total</p>}
        </div>
        <Button onClick={() => navigate("/forms/new")}>
          <Plus className="h-4 w-4 mr-2" /> Create Form
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search forms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as "published" | "draft" | "all")}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({forms.length})
        </button>
        <button
          onClick={() => setStatusFilter("published")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            statusFilter === "published" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Published ({publishedCount})
        </button>
        <button
          onClick={() => setStatusFilter("draft")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            statusFilter === "draft" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Draft ({draftCount})
        </button>
      </div>

      {isLoading ? (
        <div className="border rounded-lg overflow-x-auto">
          <div className="grid grid-cols-[1fr_100px_80px_80px_90px_50px] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[520px]">
            <span>Name</span>
            <span>Status</span>
            <span>Fields</span>
            <span>Leads</span>
            <span>Updated</span>
            <span></span>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_80px_80px_90px_50px] gap-4 px-4 py-3 border-b last:border-b-0 min-w-[520px]">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <p className="font-medium">No forms found</p>
          <p className="text-sm">Create a form to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="grid grid-cols-[1fr_100px_80px_80px_90px_50px] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[520px]">
            <span>Name</span>
            <span>Status</span>
            <span>Fields</span>
            <span>Leads</span>
            <span>Updated</span>
            <span></span>
          </div>
          {forms.map((form) => (
            <div key={form.id} className="grid grid-cols-[1fr_100px_80px_80px_90px_50px] gap-4 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors min-w-[520px]">
              <div>
                <p className="font-medium text-sm">{form.name}</p>
                <p className="text-xs text-muted-foreground">{form.description || "No description"}</p>
              </div>
              <Badge 
                variant={form.isPublished ? "default" : "secondary"} 
                className={form.isPublished ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" : ""}
              >
                {form.isPublished ? "Published" : "Draft"}
              </Badge>
              <span className="text-sm">{form.fieldsCount}</span>
              <span className="text-sm">{form.leadsCount}</span>
              <span className="text-sm text-muted-foreground">{formatDate(form.updatedAt)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/edit`)}>View Form</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/edit`)}>Edit Form</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleTogglePublish(form.id)}>
                    {form.isPublished ? "Unpublish" : "Publish"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

    </AppLayout>
  );
}
