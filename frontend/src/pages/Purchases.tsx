import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { purchasesApi, itemsApi, suppliersApi } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import { Plus, X, Search, ShoppingCart, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Autocomplete } from "@/components/ui/autocomplete";
import { SortableHeader, type SortDirection } from "@/components/ui/sortable-header";
import { getPurchaseDefaults, updatePurchaseRetention } from "@/lib/dateSettings";

const todayStr = new Date().toLocaleDateString("sv-SE");

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  supplierId: z.string().min(1, "Select a supplier"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  date: z.string().min(1, "Date is required").refine(
    (val) => val <= todayStr,
    "Date cannot be in the future"
  ),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const purchaseDefaults = getPurchaseDefaults();

  const { data: items } = useQuery({
    queryKey: queryKeys.items.all(),
    queryFn: () => itemsApi.list(),
  });
  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => suppliersApi.list(),
  });

  const itemOptions = useMemo(() => {
    if (!items) return [];
    return items.map((i) => ({
      value: i.id,
      label: i.name,
      subLabel: `(current: ${i.quantity})`,
    }));
  }, [items]);

  const supplierOptions = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.map((s) => ({
      value: s.id,
      label: s.name,
    }));
  }, [suppliers]);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: purchaseDefaults.date,
      itemId: "",
      supplierId: purchaseDefaults.supplierId,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      updatePurchaseRetention({ supplierId: data.supplierId, date: data.date });
      return purchasesApi.create({
        itemId: data.itemId,
        supplierId: data.supplierId,
        quantity: data.quantity,
        notes: data.notes || undefined,
        date: data.date,
      });
    },
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all() });
      const item = items?.find((i) => i.id === purchase.itemId);
      const supplier = suppliers?.find((s) => s.id === purchase.supplierId);
      toast.success(`Purchase recorded — ${purchase.quantity} ${item?.name ?? ""} from ${supplier?.name ?? ""}`);
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? "Failed to record purchase");
    },
  });

  function onSubmit(data: FormData) {
    createMutation.mutate(data);
  }

  const isBusy = createMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <h2 className="font-semibold">Record Purchase (Stock In)</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item *</label>
            <Controller
              name="itemId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={itemOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search item..."
                  searchPlaceholder="Search items..."
                  emptyMessage="No items found."
                  error={!!errors.itemId}
                />
              )}
            />
            {errors.itemId && <p className="text-xs text-destructive mt-1">{errors.itemId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier *</label>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={supplierOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    updatePurchaseRetention({ supplierId: val });
                  }}
                  placeholder="Search supplier..."
                  searchPlaceholder="Search suppliers..."
                  emptyMessage="No suppliers found."
                  error={!!errors.supplierId}
                />
              )}
            />
            {errors.supplierId && <p className="text-xs text-destructive mt-1">{errors.supplierId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input type="number" step="any" min="0" {...register("quantity")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" />
            {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              max={todayStr}
              {...register("date", {
                onChange: (e) => updatePurchaseRetention({ date: e.target.value }),
              })}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]"
            />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input {...register("notes")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" placeholder="Optional notes..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[42px]">Cancel</button>
            <button type="submit" disabled={isBusy} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[42px]">
              {isBusy ? "Recording..." : "Record Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type PurchaseSortKey = "date" | "itemName" | "supplierName" | "quantity" | "notes";

export default function Purchases() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<PurchaseSortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: PurchaseSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "date" ? "desc" : "asc");
    }
  };

  const { data: purchases, isLoading, isError } = useQuery({
    queryKey: queryKeys.purchases.list({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    queryFn: () =>
      purchasesApi.list({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    let result = purchases.filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.itemName.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q);
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "date") {
        comparison = a.date.localeCompare(b.date);
      } else if (sortKey === "itemName") {
        comparison = a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" });
      } else if (sortKey === "supplierName") {
        comparison = a.supplierName.localeCompare(b.supplierName, undefined, { sensitivity: "base" });
      } else if (sortKey === "quantity") {
        comparison = a.quantity - b.quantity;
      } else if (sortKey === "notes") {
        comparison = (a.notes || "").localeCompare(b.notes || "", undefined, { sensitivity: "base" });
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [purchases, search, sortKey, sortDirection]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Purchases</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity min-h-[40px]"
        >
          <Plus className="h-4 w-4" /> Record Purchase
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Search item or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px]" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <input type="date" max={todayStr} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px]" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" max={todayStr} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px]" />
        </div>
      </div>

      {filteredPurchases && filteredPurchases.length > 0 && (
        <p className="text-sm text-muted-foreground">{filteredPurchases.length} record{filteredPurchases.length !== 1 ? "s" : ""}</p>
      )}

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive text-sm">Failed to load purchases. Check your connection.</p>
          </div>
        ) : !filteredPurchases || filteredPurchases.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No purchases recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortableHeader label="Date" sortKey="date" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Item" sortKey="itemName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Supplier" sortKey="supplierName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Qty" sortKey="quantity" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right" />
                  <SortableHeader label="Notes" sortKey="notes" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3 font-medium">{p.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supplierName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{p.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <PurchaseForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

