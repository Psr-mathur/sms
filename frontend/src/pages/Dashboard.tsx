import { useQuery } from "@tanstack/react-query";
import { itemsApi, purchasesApi, salesApi } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import { Link } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];

  const { data: items } = useQuery({
    queryKey: queryKeys.items.all(),
    queryFn: () => itemsApi.list(),
  });

  const { data: purchases } = useQuery({
    queryKey: queryKeys.purchases.list({ dateFrom: today, dateTo: today }),
    queryFn: () => purchasesApi.list({ dateFrom: today, dateTo: today }),
  });

  const { data: sales } = useQuery({
    queryKey: queryKeys.sales.list({ dateFrom: today, dateTo: today }),
    queryFn: () => salesApi.list({ dateFrom: today, dateTo: today }),
  });

  // Also fetch recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: recentPurchases } = useQuery({
    queryKey: queryKeys.purchases.list({ dateFrom: thirtyDaysAgo }),
    queryFn: () => purchasesApi.list({ dateFrom: thirtyDaysAgo }),
  });
  const { data: recentSales } = useQuery({
    queryKey: queryKeys.sales.list({ dateFrom: thirtyDaysAgo }),
    queryFn: () => salesApi.list({ dateFrom: thirtyDaysAgo }),
  });

  const totalItems = items?.length ?? 0;
  const inStock = items?.filter((i) => i.status === "in_stock").length ?? 0;
  const lowStock = items?.filter((i) => i.status === "low_stock").length ?? 0;
  const outOfStock = items?.filter((i) => i.status === "out_of_stock").length ?? 0;

  const todayPurchaseQty = purchases?.reduce((s, p) => s + p.quantity, 0) ?? 0;
  const todaySaleQty = sales?.reduce((s, sale) => s + sale.quantity, 0) ?? 0;

  const recentActivity = [
    ...(recentPurchases ?? []).map((p) => ({
      type: "purchase" as const,
      itemName: p.itemName,
      partyName: p.supplierName,
      quantity: p.quantity,
      date: p.createdAt,
    })),
    ...(recentSales ?? []).map((s) => ({
      type: "sale" as const,
      itemName: s.itemName,
      partyName: s.customerName,
      quantity: s.quantity,
      date: s.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const lowStockItems = items?.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").slice(0, 5) ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden min-w-0">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Today — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-card-border rounded-lg p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Total Items</span>
          </div>
          {items ? (
            <>
              <p className="text-xl sm:text-2xl font-bold tabular-nums">{totalItems}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{inStock} in stock</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
          )}
        </div>

        <div className="bg-card border border-card-border rounded-lg p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Low / Out</span>
          </div>
          {items ? (
            <>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">{lowStock + outOfStock}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{outOfStock} out of stock</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
          )}
        </div>

        <div className="bg-card border border-card-border rounded-lg p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Today In</span>
          </div>
          {purchases ? (
            <>
              <p className="text-xl sm:text-2xl font-bold tabular-nums">{purchases.length}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{todayPurchaseQty} units in</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
          )}
        </div>

        <div className="bg-card border border-card-border rounded-lg p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Today Out</span>
          </div>
          {sales ? (
            <>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">{sales.length}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{todaySaleQty} units out</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 min-w-0">
        <div className="bg-card border border-card-border rounded-lg min-w-0">
          <div className="px-4 py-3 border-b border-card-border">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No activity yet. Add purchases or sales to get started.</p>
          ) : (
            <ul className="divide-y divide-border min-w-0">
              {recentActivity.map((a, i) => (
                <li key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        a.type === "purchase"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50"
                      }`}
                    >
                      {a.type === "purchase" ? "IN" : "OUT"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.itemName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.type === "purchase" ? `Supplier: ${a.partyName}` : `Customer: ${a.partyName}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                    {a.type === "purchase" ? "+" : "-"}{a.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-lg min-w-0">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Stock Alerts</h2>
            <Link href="/items" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">All items are well stocked.</p>
          ) : (
            <ul className="divide-y divide-border min-w-0">
              {lowStockItems.map((item) => (
                <li key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} remaining</p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg min-w-0">
        <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Items</h2>
          <Link href="/items" className="text-xs text-primary hover:underline">Manage</Link>
        </div>
        {!items ? (
          <div className="px-4 py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
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
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium min-w-0">
                      <p className="truncate max-w-[200px] sm:max-w-none">{item.name}</p>
                    </td>
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
