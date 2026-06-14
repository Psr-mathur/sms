import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Link } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const items = useLiveQuery(() => db.items.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);

  const today = new Date().toISOString().split("T")[0];

  const totalItems = items?.length ?? 0;
  const inStock = items?.filter((i) => i.status === "in_stock").length ?? 0;
  const lowStock = items?.filter((i) => i.status === "low_stock").length ?? 0;
  const outOfStock = items?.filter((i) => i.status === "out_of_stock").length ?? 0;

  const todayPurchases = purchases?.filter((p) => p.date === today) ?? [];
  const todaySales = sales?.filter((s) => s.date === today) ?? [];
  const todayPurchaseQty = todayPurchases.reduce((s, p) => s + p.quantity, 0);
  const todaySaleQty = todaySales.reduce((s, sale) => s + sale.quantity, 0);

  const recentActivity = [
    ...(purchases ?? []).map((p) => ({ type: "purchase" as const, label: `Purchased ${p.quantity} ${p.itemName} from ${p.supplierName}`, date: p.createdAt })),
    ...(sales ?? []).map((s) => ({ type: "sale" as const, label: `Sold ${s.quantity} ${s.itemName} to ${s.customerName}`, date: s.createdAt })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const lowStockItems = items?.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").slice(0, 5) ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Today — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Items</span>
          </div>
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1">{inStock} in stock</p>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low / Out</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{lowStock + outOfStock}</p>
          <p className="text-xs text-muted-foreground mt-1">{outOfStock} out of stock</p>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today In</span>
          </div>
          <p className="text-2xl font-bold">{todayPurchases.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{todayPurchaseQty} units received</p>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today Out</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{todaySales.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{todaySaleQty} units sold</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-lg">
          <div className="px-4 py-3 border-b border-card-border">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No activity yet. Add purchases or sales to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.map((a, i) => (
                <li key={i} className="px-4 py-2.5 flex items-center gap-2">
                  <span className={`text-xs font-semibold shrink-0 ${a.type === "purchase" ? "text-blue-600" : "text-emerald-600"}`}>
                    {a.type === "purchase" ? "IN" : "OUT"}
                  </span>
                  <span className="text-sm truncate">{a.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-lg">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Stock Alerts</h2>
            <Link href="/items" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">All items are well stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStockItems.map((item) => (
                <li key={item.localId} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} remaining</p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg">
        <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Items</h2>
          <Link href="/items" className="text-xs text-primary hover:underline">Manage</Link>
        </div>
        {!items || items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No items yet.</p>
            <Link href="/items" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">Add your first item</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.slice(0, 10).map((item) => (
                  <tr key={item.localId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-center"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
