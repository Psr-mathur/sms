import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, type LocalPurchase } from "@/lib/db";
import { Plus, X, Search, ShoppingCart, Filter } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  itemId: z.coerce.number().min(1, "Select an item"),
  supplierId: z.coerce.number().min(1, "Select a supplier"),
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

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const items = useLiveQuery(() => db.items.orderBy("name").toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.orderBy("name").toArray(), []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split("T")[0] },
  });

  async function onSubmit(data: FormData) {
    const quantity = Number(data.quantity);
    const item = items?.find((i) => i.localId === Number(data.itemId));
    const supplier = suppliers?.find((s) => s.localId === Number(data.supplierId));
    if (!item || !supplier) return;

    await db.purchases.add({
      itemId: item.localId!,
      itemName: item.name,
      supplierId: supplier.localId!,
      supplierName: supplier.name,
      quantity,
      notes: data.notes || null,
      date: data.date,
      createdAt: new Date().toISOString(),
    });

    const newQty = item.quantity + quantity;
    await db.items.update(item.localId!, {
      quantity: newQty,
      status: computeStatus(newQty, item.lowStockThreshold),
      updatedAt: new Date().toISOString(),
    });

    toast.success(`Purchase recorded — ${quantity} ${item.name} from ${supplier.name}`);
    onClose();
  }

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
            <select {...register("itemId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select item...</option>
              {items?.map((i) => (
                <option key={i.localId} value={i.localId}>{i.name} (current: {i.quantity})</option>
              ))}
            </select>
            {errors.itemId && <p className="text-xs text-destructive mt-1">{errors.itemId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier *</label>
            <select {...register("supplierId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select supplier...</option>
              {suppliers?.map((s) => (
                <option key={s.localId} value={s.localId}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && <p className="text-xs text-destructive mt-1">{errors.supplierId.message}</p>}
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
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting ? "Recording..." : "Record Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Purchases() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const purchases = useLiveQuery(async () => {
    let all = await db.purchases.orderBy("date").reverse().toArray();
    if (search) all = all.filter((p) => p.itemName.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase()));
    if (dateFrom) all = all.filter((p) => p.date >= dateFrom);
    if (dateTo) all = all.filter((p) => p.date <= dateTo);
    return all;
  }, [search, dateFrom, dateTo]);



  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Purchases</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Record Purchase
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Search item or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {purchases && purchases.length > 0 && (
        <p className="text-sm text-muted-foreground">{purchases.length} record{purchases.length !== 1 ? "s" : ""}</p>
      )}

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {!purchases || purchases.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No purchases recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Supplier</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Notes</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.map((p) => (
                  <tr key={p.localId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3 font-medium">{p.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supplierName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{p.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.notes ?? ""}</td>
                    <td className="px-4 py-3 text-right">
                    </td>
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
