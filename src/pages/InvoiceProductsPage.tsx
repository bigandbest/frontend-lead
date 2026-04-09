import { useMemo, useState } from "react";
import { Plus, Search, PackageSearch, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateInvoiceProduct, useDeleteInvoiceProduct, useInvoiceProducts, useUpdateInvoiceProduct } from "@/hooks/useInvoices";
import type { InvoiceProduct } from "@/api/invoices";
import { useUsers } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/authStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function InvoiceProductsPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxRatePct, setTaxRatePct] = useState("");
  const [editingProduct, setEditingProduct] = useState<InvoiceProduct | null>(null);
  const [collapsedAgents, setCollapsedAgents] = useState<Record<string, boolean>>({});
  const [editName, setEditName] = useState("");
  const [editHsnCode, setEditHsnCode] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editTaxRatePct, setEditTaxRatePct] = useState("");

  const { data, isLoading } = useInvoiceProducts({
    limit: 300,
    search: search || undefined,
    isActive: true,
  });
  const { user } = useAuthStore();
  const { data: usersData } = useUsers({ limit: 200, isActive: true });
  const createProduct = useCreateInvoiceProduct();
  const updateProduct = useUpdateInvoiceProduct();
  const deleteProduct = useDeleteInvoiceProduct();

  const products = data?.data ?? [];
  const users = usersData?.data ?? [];
  const isAdminPanel = user?.role === "admin" || user?.role === "super_admin";

  const userNameById = useMemo(
    () =>
      new Map(
        users.map((u) => [
          u.id,
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Unknown Agent",
        ])
      ),
    [users]
  );

  const groupedProducts = useMemo(() => {
    const grouped = new Map<string, InvoiceProduct[]>();
    for (const p of products) {
      const key = p.createdById ?? "__unassigned__";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    }

    return Array.from(grouped.entries())
      .map(([agentId, items]) => ({
        agentId,
        agentName:
          agentId === "__unassigned__" ? "Unassigned" : (userNameById.get(agentId) ?? "Unknown Agent"),
        items,
      }))
      .sort((a, b) => a.agentName.localeCompare(b.agentName));
  }, [products, userNameById]);

  const toggleAgentCollapse = (agentId: string) => {
    setCollapsedAgents((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const canCreate = useMemo(
    () => Boolean(name.trim() && hsnCode.trim() && unitPrice),
    [name, hsnCode, unitPrice]
  );

  const onCreate = async () => {
    if (!canCreate) return;

    await createProduct.mutateAsync({
      name: name.trim(),
      hsnCode: hsnCode.trim(),
      unitPrice: Number(unitPrice),
      taxRatePct: Number(taxRatePct),
    });

    setName("");
    setHsnCode("");
    setUnitPrice("");
    setTaxRatePct("");
  };

  const openEdit = (product: InvoiceProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditHsnCode(product.hsnCode);
    setEditUnitPrice(String(product.unitPrice));
    setEditTaxRatePct(String(product.taxRatePct ?? 0));
  };

  const onUpdate = async () => {
    if (!editingProduct) return;

    await updateProduct.mutateAsync({
      id: editingProduct.id,
      payload: {
        name: editName.trim(),
        hsnCode: editHsnCode.trim(),
        unitPrice: Number(editUnitPrice),
        taxRatePct: Number(editTaxRatePct),
      },
    });

    setEditingProduct(null);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Product Catalogue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Agents can prepare products here and select them directly while creating invoices.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <Label className="text-xs">Product Name</Label>
                <Input
                  className="h-9 mt-1"
                  placeholder="e.g. LED Bulb"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">HSN Code</Label>
                <Input
                  className="h-9 mt-1"
                  placeholder="e.g. 9405"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Unit Price</Label>
                <Input
                  className="h-9 mt-1"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Tax %</Label>
                <Input
                  className="h-9 mt-1"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="0"
                  value={taxRatePct}
                  onChange={(e) => setTaxRatePct(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={onCreate}
                disabled={!canCreate || !taxRatePct.trim() || createProduct.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createProduct.isPending ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by product or HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Product</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : products.length === 0 ? (
          <div className="border rounded-lg py-14 text-center text-muted-foreground">
            <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No products in catalogue
          </div>
        ) : isAdminPanel ? (
          <div className="space-y-4">
            {groupedProducts.map((group) => (
              <div key={group.agentId} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-muted/30 text-sm font-medium flex items-center justify-between hover:bg-muted/40"
                  onClick={() => toggleAgentCollapse(group.agentId)}
                >
                  <span>{group.agentName} ({group.items.length})</span>
                  {collapsedAgents[group.agentId] ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {!collapsedAgents[group.agentId] && (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10">
                        <TableHead>Product</TableHead>
                        <TableHead>HSN Code</TableHead>
                        <TableHead className="text-right">Tax %</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.hsnCode}</TableCell>
                          <TableCell className="text-right">{(product.taxRatePct ?? 0).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteProduct.mutate(product.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Product</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell className="text-right">{(product.taxRatePct ?? 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteProduct.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product name, HSN code, tax rate, or price.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Product Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">HSN Code</Label>
                <Input value={editHsnCode} onChange={(e) => setEditHsnCode(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Unit Price</Label>
                <Input type="number" min={0} step={0.01} value={editUnitPrice} onChange={(e) => setEditUnitPrice(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Tax %</Label>
                <Input type="number" min={0} max={100} step={0.01} value={editTaxRatePct} onChange={(e) => setEditTaxRatePct(e.target.value)} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button onClick={onUpdate} disabled={updateProduct.isPending}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
