import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getRetentionSettings,
  saveRetentionSettings,
  getRetentionStatusString,
  getPurchaseDefaults,
  getSaleDefaults,
  clearRetention,
  type DurationUnit,
  type RetentionSettings,
} from "@/lib/dateSettings";
import { Clock, RotateCcw, Check, Sparkles, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { suppliersApi, customersApi } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";

interface DateConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateConfigDialog({ open, onOpenChange }: DateConfigDialogProps) {
  const [settings, setSettings] = useState<RetentionSettings>(getRetentionSettings());
  const [, setTick] = useState(0);

  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => suppliersApi.list(),
    enabled: open,
  });

  const { data: customers } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.list(),
    enabled: open,
  });

  // Refresh settings when popup opens
  useEffect(() => {
    if (open) {
      setSettings(getRetentionSettings());
    }
  }, [open]);

  // Tick every 10s to update countdown live
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [open]);

  const handleToggleEnabled = (enabled: boolean) => {
    const updated = saveRetentionSettings({ enabled });
    setSettings(updated);
    toast.success(enabled ? "Form retention enabled" : "Form retention disabled");
  };

  const handleDurationChange = (val: number, unit: DurationUnit) => {
    const validVal = Math.max(1, val);
    const updated = saveRetentionSettings({ durationValue: validVal, durationUnit: unit });
    setSettings(updated);
    toast.success(`Retention duration set to ${validVal} ${unit}`);
  };

  const handleResetAll = () => {
    clearRetention("all");
    setSettings(getRetentionSettings());
    toast.success("Retention reset for all forms");
  };

  const purchaseDefaults = getPurchaseDefaults();
  const saleDefaults = getSaleDefaults();
  const purchaseStatus = getRetentionStatusString("purchase");
  const saleStatus = getRetentionStatusString("sale");

  const activeSupplier = suppliers?.find((s) => s.id === purchaseDefaults.supplierId)?.name;
  const activeCustomer = customers?.find((c) => c.id === saleDefaults.customerId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md p-5 rounded-xl bg-card border-card-border shadow-2xl max-h-[90vh] overflow-y-auto z-[70]">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-amber-500 shrink-0" />
            <DialogTitle className="text-lg font-bold tracking-tight">Form Input Retention</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure how long selected Supplier, Customer, and Date values remain pre-filled in forms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
            <div>
              <span className="text-sm font-semibold text-foreground block">Remember Form Entries</span>
              <span className="text-[11px] text-muted-foreground">Pre-fill forms with recently selected entries</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleEnabled(!settings.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enabled ? "bg-amber-500" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Retention Duration Settings */}
          <div className={`space-y-3 transition-opacity ${settings.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Retention Duration
              </label>
              <div className="flex gap-1">
                {([
                  { v: 15, u: "minutes" as const, l: "15m" },
                  { v: 30, u: "minutes" as const, l: "30m" },
                  { v: 1, u: "hours" as const, l: "1h" },
                  { v: 2, u: "hours" as const, l: "2h" },
                ]).map((p) => {
                  const isActive = settings.durationValue === p.v && settings.durationUnit === p.u;
                  return (
                    <button
                      key={p.l}
                      type="button"
                      onClick={() => handleDurationChange(p.v, p.u)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        isActive ? "bg-amber-500 text-slate-950 font-bold" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {p.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.durationValue}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1, settings.durationUnit)}
                className="w-20 border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring text-center"
              />
              <select
                value={settings.durationUnit}
                onChange={(e) => handleDurationChange(settings.durationValue, e.target.value as DurationUnit)}
                className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring flex-1"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Purchase Form retains <b>[Supplier, Date]</b> and Sale Form retains <b>[Customer, Date]</b> for {settings.durationValue} {settings.durationUnit}.
            </p>
          </div>

          <div className="border-t border-border/60 my-2" />

          {/* Active Retention Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Active Retention Overview
            </h3>

            {/* Purchase Form Status */}
            <div className="bg-muted/20 border border-border/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Purchase Form</span>
                <span className="text-[11px] font-semibold text-amber-500">{purchaseStatus || "Default / Expired"}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Supplier: <span className="text-foreground font-medium">{activeSupplier || "None"}</span> • Date: <span className="text-foreground font-medium">{purchaseDefaults.date}</span>
              </p>
            </div>

            {/* Sale Form Status */}
            <div className="bg-muted/20 border border-border/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Sale Form</span>
                <span className="text-[11px] font-semibold text-amber-500">{saleStatus || "Default / Expired"}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Customer: <span className="text-foreground font-medium">{activeCustomer || "None"}</span> • Date: <span className="text-foreground font-medium">{saleDefaults.date}</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear All Retention
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground font-medium text-sm px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
