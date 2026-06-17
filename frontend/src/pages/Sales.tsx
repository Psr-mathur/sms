import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { salesApi, itemsApi, customersApi } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import { Plus, X, Search, TrendingUp, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

const todayStr = new Date().toLocaleDateString("sv-SE");

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  customerId: z.string().min(1, "Select a customer"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  date: z.string().min(1, "Date is required").refine(
    (val) => val <= todayStr,
    "Date cannot be in the future"
  ),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SaleForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: queryKeys.items.all(),
    queryFn: () => itemsApi.list(),
  });
  const { data: customers } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.list(),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayStr },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      salesApi.create({
        itemId: data.itemId,
        customerId: data.customerId,
        quantity: data.quantity,
        notes: data.notes || undefined,
        date: data.date,
      }),
    onSuccess: (sale) => {
      // Invalidate sales AND items (backend deducted stock atomically)
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all() });
      const item = items?.find((i) => i.id === sale.itemId);
      const customer = customers?.find((c) => c.id === sale.customerId);
      toast.success(`Sale recorded — ${sale.quantity} ${item?.name ?? ""} to ${customer?.name ?? ""}`);
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      // Backend returns 400 with "Insufficient stock" if qty > available
      toast.error(err.response?.data?.error ?? "Failed to record sale");
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
          <h2 className="font-semibold">Record Sale (Stock Out)</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item *</label>
            <select {...register("itemId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select item...</option>
              {items?.map((i) => (
                <option key={i.id} value={i.id}>{i.name} (available: {i.quantity})</option>
              ))}
            </select>
            {errors.itemId && <p className="text-xs text-destructive mt-1">{errors.itemId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer *</label>
            <select {...register("customerId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select customer...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-destructive mt-1">{errors.customerId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input type="number" step="any" min="0" {...register("quantity")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input type="date" max={todayStr} {...register("date")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input {...register("notes")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional notes..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={isBusy} className="flex-1 bg-emerald-600 text-white rounded-md py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {isBusy ? "Recording..." : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: sales, isLoading, isError } = useQuery({
    queryKey: queryKeys.sales.list({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    queryFn: () =>
      salesApi.list({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const filteredSales = sales
    ?.slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.itemName.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
    });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Record Sale
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Search item or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <input type="date" max={todayStr} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" max={todayStr} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {filteredSales && filteredSales.length > 0 && (
        <p className="text-sm text-muted-foreground">{filteredSales.length} record{filteredSales.length !== 1 ? "s" : ""}</p>
      )}

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive text-sm">Failed to load sales. Check your connection.</p>
          </div>
        ) : !filteredSales || filteredSales.length === 0 ? (
          <div className="py-12 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3 font-medium">{s.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.customerName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{s.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <SaleForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
