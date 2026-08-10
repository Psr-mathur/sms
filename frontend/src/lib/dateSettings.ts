export type DurationUnit = "minutes" | "hours";

export interface PurchaseRetention {
  supplierId: string;
  date: string;
  setAt: number;
}

export interface SaleRetention {
  customerId: string;
  date: string;
  setAt: number;
}

export interface RetentionSettings {
  enabled: boolean;
  durationValue: number;
  durationUnit: DurationUnit;
  purchaseRetention: PurchaseRetention | null;
  saleRetention: SaleRetention | null;
}

const STORAGE_KEY = "stock_manager_form_retention_settings";

const defaultSettings: RetentionSettings = {
  enabled: true,
  durationValue: 30,
  durationUnit: "minutes",
  purchaseRetention: null,
  saleRetention: null,
};

export function getRetentionSettings(): RetentionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveRetentionSettings(settings: Partial<RetentionSettings>): RetentionSettings {
  const current = getRetentionSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save retention settings", e);
  }
  return updated;
}

export function getDurationInMs(value: number, unit: DurationUnit): number {
  return unit === "hours" ? value * 60 * 60 * 1000 : value * 60 * 1000;
}

export function getTodayStr(): string {
  return new Date().toLocaleDateString("sv-SE");
}

export function getPurchaseDefaults(): { supplierId: string; date: string } {
  const today = getTodayStr();
  const settings = getRetentionSettings();

  if (!settings.enabled || !settings.purchaseRetention) {
    return { supplierId: "", date: today };
  }

  const { supplierId, date, setAt } = settings.purchaseRetention;
  const maxAgeMs = getDurationInMs(settings.durationValue, settings.durationUnit);
  if (Date.now() - setAt > maxAgeMs) {
    return { supplierId: "", date: today };
  }

  return {
    supplierId: supplierId || "",
    date: date || today,
  };
}

export function getSaleDefaults(): { customerId: string; date: string } {
  const today = getTodayStr();
  const settings = getRetentionSettings();

  if (!settings.enabled || !settings.saleRetention) {
    return { customerId: "", date: today };
  }

  const { customerId, date, setAt } = settings.saleRetention;
  const maxAgeMs = getDurationInMs(settings.durationValue, settings.durationUnit);
  if (Date.now() - setAt > maxAgeMs) {
    return { customerId: "", date: today };
  }

  return {
    customerId: customerId || "",
    date: date || today,
  };
}

export function updatePurchaseRetention(data: { supplierId?: string; date?: string }) {
  const settings = getRetentionSettings();
  if (!settings.enabled) return;

  const current = getPurchaseDefaults();
  const newSupplierId = data.supplierId !== undefined ? data.supplierId : current.supplierId;
  const newDate = data.date !== undefined ? data.date : current.date;

  saveRetentionSettings({
    purchaseRetention: {
      supplierId: newSupplierId,
      date: newDate,
      setAt: Date.now(),
    },
  });
}

export function updateSaleRetention(data: { customerId?: string; date?: string }) {
  const settings = getRetentionSettings();
  if (!settings.enabled) return;

  const current = getSaleDefaults();
  const newCustomerId = data.customerId !== undefined ? data.customerId : current.customerId;
  const newDate = data.date !== undefined ? data.date : current.date;

  saveRetentionSettings({
    saleRetention: {
      customerId: newCustomerId,
      date: newDate,
      setAt: Date.now(),
    },
  });
}

export function getRetentionStatusString(type: "purchase" | "sale"): string | null {
  const settings = getRetentionSettings();
  if (!settings.enabled) return null;

  const retention = type === "purchase" ? settings.purchaseRetention : settings.saleRetention;
  if (!retention) return null;

  const maxAgeMs = getDurationInMs(settings.durationValue, settings.durationUnit);
  const remainingMs = maxAgeMs - (Date.now() - retention.setAt);
  if (remainingMs <= 0) return null;

  const remainingMins = Math.ceil(remainingMs / (60 * 1000));
  const timeStr = remainingMins >= 60
    ? `~${(remainingMins / 60).toFixed(1)} hrs`
    : `${remainingMins} min${remainingMins === 1 ? "" : "s"}`;

  return `Active — expires in ${timeStr}`;
}

export function clearRetention(type: "purchase" | "sale" | "all") {
  if (type === "purchase") {
    saveRetentionSettings({ purchaseRetention: null });
  } else if (type === "sale") {
    saveRetentionSettings({ saleRetention: null });
  } else {
    saveRetentionSettings({ purchaseRetention: null, saleRetention: null });
  }
}
