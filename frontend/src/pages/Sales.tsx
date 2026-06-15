import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, type LocalSale } from "@/lib/db";
import { Plus, X, Search, TrendingUp, Filter } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  itemId: z.coerce.number().refine((val) => val !== 0 && !isNaN(val), "Select an item"),
  customerId: z.coerce.number().refine((val) => val !== 0 && !isNaN(val), "Select a customer"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const items = useLiveQuery(() => db.items.orderBy("name").toArray(), []);
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray(), []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split("T")[0] },
  });

  async function onSubmit(data: FormData) {
    const quantity = Number(data.quantity);
    const item = items?.find((i) => i.localId === Number(data.itemId));
    const customer = customers?.find((c) => c.localId === Number(data.customerId));
    if (!item || !customer) return;

    if (quantity > item.quantity) {
      toast.error(`Insufficient stock. Only ${item.quantity} available.`);
      return;
    }

    await db.sales.add({
      itemId: item.localId!,
      itemName: item.name,
      customerId: customer.localId!,
      customerName: customer.name,
      quantity,
      notes: data.notes || null,
      date: data.date,
      createdAt: new Date().toISOString(),
    });

    const newQty = Math.max(0, item.quantity - quantity);
    await db.items.update(item.localId!, {
      quantity: newQty,
      status: computeStatus(newQty, item.lowStockThreshold),
      updatedAt: new Date().toISOString(),
    });

    toast.success(`Sale recorded — ${quantity} ${item.name} to ${customer.name}`);
    onClose();
  }

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
                <option key={i.localId} value={i.localId}>{i.name} (available: {i.quantity})</option>
              ))}
            </select>
            {errors.itemId && <p className="text-xs text-destructive mt-1">{errors.itemId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer *</label>
            <select {...register("customerId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select customer...</option>
              {customers?.map((c) => (
                <option key={c.localId} value={c.localId}>{c.name}</option>
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
            <input type="date" {...register("date")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input {...register("notes")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional notes..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white rounded-md py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {isSubmitting ? "Recording..." : "Record Sale"}
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

  const sales = useLiveQuery(async () => {
    let all = await db.sales.orderBy("date").reverse().toArray();
    if (search) all = all.filter((s) => s.itemName.toLowerCase().includes(search.toLowerCase()) || s.customerName.toLowerCase().includes(search.toLowerCase()));
    if (dateFrom) all = all.filter((s) => s.date >= dateFrom);
    if (dateTo) all = all.filter((s) => s.date <= dateTo);
    return all;
  }, [search, dateFrom, dateTo]);



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
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {sales && sales.length > 0 && (
        <p className="text-sm text-muted-foreground">{sales.length} record{sales.length !== 1 ? "s" : ""}</p>
      )}

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {!sales || sales.length === 0 ? (
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
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((s) => (
                  <tr key={s.localId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3 font-medium">{s.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.customerName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{s.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.notes ?? ""}</td>
                    <td className="px-4 py-3 text-right">
                    </td>
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
