import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { purchasesApi, salesApi } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import { Printer, Loader2 } from "lucide-react";

function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ─── Daily Tab ─────────────────────────────────────────────────────────── */
function DailyReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: purchases, isLoading: loadingP } = useQuery({
    queryKey: queryKeys.purchases.list({ dateFrom: date, dateTo: date }),
    queryFn: () => purchasesApi.list({ dateFrom: date, dateTo: date }),
  });

  const { data: sales, isLoading: loadingS } = useQuery({
    queryKey: queryKeys.sales.list({ dateFrom: date, dateTo: date }),
    queryFn: () => salesApi.list({ dateFrom: date, dateTo: date }),
  });

  const purchaseQty = purchases?.reduce((s, p) => s + p.quantity, 0) ?? 0;
  const saleQty = sales?.reduce((s, sale) => s + sale.quantity, 0) ?? 0;
  const isLoading = loadingP || loadingS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <PrintButton label="Print Daily Report" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Purchases</p>
              <p className="text-2xl font-bold">{purchases?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">{purchaseQty} units in</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{sales?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">{saleQty} units out</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Qty</p>
              <p className={`text-2xl font-bold ${purchaseQty - saleQty >= 0 ? "text-foreground" : "text-red-500"}`}>{purchaseQty - saleQty}</p>
              <p className="text-sm text-muted-foreground">in minus out</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-lg">
              <div className="px-4 py-3 border-b border-card-border font-semibold text-sm">Purchases on {date}</div>
              {!purchases?.length ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No purchases on this date</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-2 text-left text-xs text-muted-foreground">Item</th><th className="px-4 py-2 text-left text-xs text-muted-foreground">Supplier</th><th className="px-4 py-2 text-right text-xs text-muted-foreground">Qty</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {purchases.map((p) => (
                      <tr key={p.id}><td className="px-4 py-2.5 font-medium">{p.itemName}</td><td className="px-4 py-2.5 text-muted-foreground">{p.supplierName}</td><td className="px-4 py-2.5 text-right tabular-nums">{p.quantity}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-card border border-card-border rounded-lg">
              <div className="px-4 py-3 border-b border-card-border font-semibold text-sm">Sales on {date}</div>
              {!sales?.length ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No sales on this date</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-2 text-left text-xs text-muted-foreground">Item</th><th className="px-4 py-2 text-left text-xs text-muted-foreground">Customer</th><th className="px-4 py-2 text-right text-xs text-muted-foreground">Qty</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {sales.map((s) => (
                      <tr key={s.id}><td className="px-4 py-2.5 font-medium">{s.itemName}</td><td className="px-4 py-2.5 text-muted-foreground">{s.customerName}</td><td className="px-4 py-2.5 text-right tabular-nums">{s.quantity}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Monthly Tab ───────────────────────────────────────────────────────── */
function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: purchases, isLoading: loadingP } = useQuery({
    queryKey: queryKeys.purchases.list({ dateFrom, dateTo }),
    queryFn: () => purchasesApi.list({ dateFrom, dateTo }),
  });

  const { data: sales, isLoading: loadingS } = useQuery({
    queryKey: queryKeys.sales.list({ dateFrom, dateTo }),
    queryFn: () => salesApi.list({ dateFrom, dateTo }),
  });

  const isLoading = loadingP || loadingS;
  const purchaseQty = purchases?.reduce((s, p) => s + p.quantity, 0) ?? 0;
  const saleQty = sales?.reduce((s, sale) => s + sale.quantity, 0) ?? 0;

  const dayMap = new Map<string, { inQty: number; outQty: number }>();
  purchases?.forEach((p) => {
    const d = dayMap.get(p.date) ?? { inQty: 0, outQty: 0 };
    dayMap.set(p.date, { ...d, inQty: d.inQty + p.quantity });
  });
  sales?.forEach((s) => {
    const d = dayMap.get(s.date) ?? { inQty: 0, outQty: 0 };
    dayMap.set(s.date, { ...d, outQty: d.outQty + s.quantity });
  });
  const breakdown = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none w-24" />
        </div>
        <PrintButton label="Print Monthly Report" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total In (Purchases)</p>
              <p className="text-2xl font-bold">{purchases?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">{purchaseQty} units</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Out (Sales)</p>
              <p className="text-2xl font-bold text-emerald-600">{sales?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">{saleQty} units</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Qty</p>
              <p className={`text-2xl font-bold ${purchaseQty - saleQty >= 0 ? "text-foreground" : "text-red-500"}`}>{purchaseQty - saleQty}</p>
            </div>
          </div>

          {breakdown.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-card-border font-semibold text-sm">Day-by-Day Breakdown</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-2 text-left text-xs text-muted-foreground">Date</th><th className="px-4 py-2 text-right text-xs text-muted-foreground">In (Purchases)</th><th className="px-4 py-2 text-right text-xs text-muted-foreground">Out (Sales)</th><th className="px-4 py-2 text-right text-xs text-muted-foreground">Net</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {breakdown.map(([date, data]) => (
                      <tr key={date} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">{date}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{data.inQty}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{data.outQty}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${data.inQty - data.outQty >= 0 ? "" : "text-red-500"}`}>{data.inQty - data.outQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── By Customer Tab ───────────────────────────────────────────────────── */
function ByCustomerReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: sales, isLoading } = useQuery({
    queryKey: queryKeys.sales.list({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    queryFn: () => salesApi.list({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  const customerData = sales
    ? (() => {
        const map = new Map<number, { name: string; transactions: number; totalQty: number }>();
        for (const s of sales) {
          const e = map.get(s.customerId) ?? { name: s.customerName, transactions: 0, totalQty: 0 };
          map.set(s.customerId, { ...e, transactions: e.transactions + 1, totalQty: e.totalQty + s.quantity });
        }
        return [...map.values()].sort((a, b) => b.totalQty - a.totalQty);
      })()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none" />
        </div>
        <PrintButton label="Print Customer Report" />
      </div>
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !customerData?.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No sales data found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-2.5 text-left text-xs text-muted-foreground">Customer</th><th className="px-4 py-2.5 text-right text-xs text-muted-foreground">Transactions</th><th className="px-4 py-2.5 text-right text-xs text-muted-foreground">Total Qty</th></tr></thead>
            <tbody className="divide-y divide-border">
              {customerData.map((c, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.transactions}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{c.totalQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── By Supplier Tab ───────────────────────────────────────────────────── */
function BySupplierReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: purchases, isLoading } = useQuery({
    queryKey: queryKeys.purchases.list({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    queryFn: () => purchasesApi.list({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  const supplierData = purchases
    ? (() => {
        const map = new Map<number, { name: string; transactions: number; totalQty: number }>();
        for (const p of purchases) {
          const e = map.get(p.supplierId) ?? { name: p.supplierName, transactions: 0, totalQty: 0 };
          map.set(p.supplierId, { ...e, transactions: e.transactions + 1, totalQty: e.totalQty + p.quantity });
        }
        return [...map.values()].sort((a, b) => b.totalQty - a.totalQty);
      })()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none" />
        </div>
        <PrintButton label="Print Supplier Report" />
      </div>
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !supplierData?.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No purchase data found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-2.5 text-left text-xs text-muted-foreground">Supplier</th><th className="px-4 py-2.5 text-right text-xs text-muted-foreground">Transactions</th><th className="px-4 py-2.5 text-right text-xs text-muted-foreground">Total Qty</th></tr></thead>
            <tbody className="divide-y divide-border">
              {supplierData.map((s, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.transactions}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{s.totalQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "by-customer", label: "By Customer" },
  { key: "by-supplier", label: "By Supplier" },
] as const;
type Tab = typeof TABS[number]["key"];

export default function Reports() {
  const [tab, setTab] = useState<Tab>("daily");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold">Reports</h1>
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-2">
        {tab === "daily" && <DailyReport />}
        {tab === "monthly" && <MonthlyReport />}
        {tab === "by-customer" && <ByCustomerReport />}
        {tab === "by-supplier" && <BySupplierReport />}
      </div>
    </div>
  );
}
