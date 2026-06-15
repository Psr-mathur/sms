import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { itemsApi, type Item, type ItemStatus } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  lowStockThreshold: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

function ItemForm({ item, onClose }: { item?: Item; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      lowStockThreshold: item?.lowStockThreshold ?? 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      itemsApi.create({
        name: data.name,
        description: data.description || undefined,
        lowStockThreshold: data.lowStockThreshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all() });
      toast.success("Item added");
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? "Failed to add item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      itemsApi.update(item!.id, {
        name: data.name,
        description: data.description,
        lowStockThreshold: data.lowStockThreshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all() });
      toast.success("Item updated");
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? "Failed to update item");
    },
  });

  function onSubmit(data: FormData) {
    if (item) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <h2 className="font-semibold">{item ? "Edit Item" : "Add Item"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Sugar bags" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input {...register("description")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Threshold *</label>
            <input type="number" step="any" {...register("lowStockThreshold")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.lowStockThreshold && <p className="text-xs text-destructive mt-1">{errors.lowStockThreshold.message}</p>}
          </div>
          <p className="text-xs text-muted-foreground">Alert when quantity falls at or below the threshold</p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={isBusy} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isBusy ? "Saving..." : item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusFilters: { value: "all" | ItemStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ItemStatus>("all");

  const { data: items, isLoading, isError } = useQuery({
    queryKey: queryKeys.items.list({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    queryFn: () =>
      itemsApi.list({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Stock Items</h1>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive text-sm">Failed to load items. Check your connection.</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Threshold</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <ItemForm item={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />}
    </div>
  );
}
