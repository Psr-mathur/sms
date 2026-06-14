import { db } from "./db";

async function syncPush(payload: any) {
  const response = await fetch("/api/sync/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Sync push failed: ${response.statusText}`);
  }
  return response.json();
}

async function syncPull(params?: { since?: string }) {
  const url = params?.since ? `/api/sync/pull?since=${encodeURIComponent(params.since)}` : "/api/sync/pull";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sync pull failed: ${response.statusText}`);
  }
  return response.json();
}

const LAST_SYNC_KEY = "stockmanager_last_sync";

export function getLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSync(ts: string) {
  localStorage.setItem(LAST_SYNC_KEY, ts);
}

export async function runSync(): Promise<{ pushed: number; pulled: number }> {
  if (!navigator.onLine) throw new Error("No internet connection");

  const [items, suppliers, customers, purchases, sales] = await Promise.all([
    db.items.toArray(),
    db.suppliers.toArray(),
    db.customers.toArray(),
    db.purchases.toArray(),
    db.sales.toArray(),
  ]);

  const pushPayload = {
    items: items.map((i) => ({
      name: i.name,
      description: i.description ?? undefined,
      quantity: i.quantity,
      unit: "pcs",
      lowStockThreshold: i.lowStockThreshold,
    })),
    suppliers: suppliers.map((s) => ({
      name: s.name,
      contactName: s.contactName ?? undefined,
      phone: s.phone ?? undefined,
      email: s.email ?? undefined,
      address: s.address ?? undefined,
    })),
    customers: customers.map((c) => ({
      name: c.name,
      contactName: c.contactName ?? undefined,
      phone: c.phone ?? undefined,
      email: c.email ?? undefined,
      address: c.address ?? undefined,
    })),
    purchases: purchases
      .filter((p) => p.itemId > 0 && p.supplierId > 0)
      .map((p) => ({
        itemId: p.itemId,
        supplierId: p.supplierId,
        quantity: p.quantity,
        unitPrice: 0,
        notes: p.notes ?? undefined,
        date: p.date,
      })),
    sales: sales
      .filter((s) => s.itemId > 0 && s.customerId > 0)
      .map((s) => ({
        itemId: s.itemId,
        customerId: s.customerId,
        quantity: s.quantity,
        unitPrice: 0,
        notes: s.notes ?? undefined,
        date: s.date,
      })),
  };

  const pushResult = await syncPush(pushPayload);
  const pushed =
    (pushResult.counts?.items ?? 0) +
    (pushResult.counts?.suppliers ?? 0) +
    (pushResult.counts?.customers ?? 0) +
    (pushResult.counts?.purchases ?? 0) +
    (pushResult.counts?.sales ?? 0);

  const since = getLastSync();
  const pullResult = await syncPull(since ? { since } : {});

  let pulled = 0;

  if (pullResult.items?.length) {
    for (const item of pullResult.items) {
      const existing = item.id ? await db.items.where("id").equals(item.id).first() : null;
      if (!existing) {
        await db.items.add({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          quantity: item.quantity,
          status: item.status as "in_stock" | "low_stock" | "out_of_stock",
          lowStockThreshold: item.lowStockThreshold,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
        pulled++;
      }
    }
  }

  if (pullResult.suppliers?.length) {
    for (const s of pullResult.suppliers) {
      const existing = s.id ? await db.suppliers.where("id").equals(s.id).first() : null;
      if (!existing) {
        await db.suppliers.add({
          id: s.id,
          name: s.name,
          contactName: s.contactName ?? null,
          phone: s.phone ?? null,
          email: s.email ?? null,
          address: s.address ?? null,
          createdAt: s.createdAt,
        });
        pulled++;
      }
    }
  }

  if (pullResult.customers?.length) {
    for (const c of pullResult.customers) {
      const existing = c.id ? await db.customers.where("id").equals(c.id).first() : null;
      if (!existing) {
        await db.customers.add({
          id: c.id,
          name: c.name,
          contactName: c.contactName ?? null,
          phone: c.phone ?? null,
          email: c.email ?? null,
          address: c.address ?? null,
          createdAt: c.createdAt,
        });
        pulled++;
      }
    }
  }

  setLastSync(new Date().toISOString());
  return { pushed, pulled };
}
