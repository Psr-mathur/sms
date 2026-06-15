import { db, rawDb } from "./db";
import { fetchWithBase } from "./api";

// Sync API client helpers
async function syncPush(payload: any) {
  const response = await fetchWithBase("/api/sync/push", {
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
  const response = await fetchWithBase(url);
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

// ----------------------------------------------------
// MODULAR SYNC OPERATIONS
// ----------------------------------------------------

/**
 * Pulls the latest catalog from the backend, handles deletions, and resolves conflicts.
 */
async function pullAndSyncCatalog(since: string | null): Promise<number> {
  const pullResult = await syncPull(since ? { since } : {});
  let pulled = 0;

  // Sync Items
  if (pullResult.items) {
    const pulledItemIds = new Set(pullResult.items.map((i: any) => i.id));
    const currentItems = await rawDb.items.toArray();

    // 1. Delete local items that were deleted on backend
    for (const localItem of currentItems) {
      if (localItem.id && !pulledItemIds.has(localItem.id)) {
        await rawDb.items.delete(localItem.localId!);
        console.log(`Deleted item locally: ${localItem.name}`);
      }
    }

    // 2. Add or update items with conflict resolution
    for (const item of pullResult.items) {
      const existing = await rawDb.items.where("name").equals(item.name).first();
      const existingOffline = await rawDb.offlineItems.where("name").equals(item.name).first();

      const localUpdatedAt = existingOffline ? existingOffline.updatedAt : (existing ? existing.updatedAt : null);
      const backendNewer = localUpdatedAt ? new Date(item.updatedAt) > new Date(localUpdatedAt) : true;

      if (existing) {
        if (backendNewer || !existing.id) {
          await rawDb.items.update(existing.localId!, {
            id: item.id,
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
            status: item.status as any,
            description: item.description,
            updatedAt: item.updatedAt
          });
          if (existingOffline && backendNewer) {
            await rawDb.offlineItems.delete(existingOffline.localId!);
          }
        }
      } else {
        await rawDb.items.add({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          quantity: item.quantity,
          status: item.status as any,
          lowStockThreshold: item.lowStockThreshold,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        pulled++;
      }
    }
  }

  // Sync Suppliers
  if (pullResult.suppliers) {
    const pulledSupplierIds = new Set(pullResult.suppliers.map((s: any) => s.id));
    const currentSuppliers = await rawDb.suppliers.toArray();

    for (const localSupplier of currentSuppliers) {
      if (localSupplier.id && !pulledSupplierIds.has(localSupplier.id)) {
        await rawDb.suppliers.delete(localSupplier.localId!);
      }
    }

    for (const s of pullResult.suppliers) {
      const existing = await rawDb.suppliers.where("name").equals(s.name).first();
      const existingOffline = await rawDb.offlineSuppliers.where("name").equals(s.name).first();
      
      if (existing) {
        await rawDb.suppliers.update(existing.localId!, {
          id: s.id,
          contactName: s.contactName,
          phone: s.phone,
          email: s.email,
          address: s.address
        });
        if (existingOffline) {
          await rawDb.offlineSuppliers.delete(existingOffline.localId!);
        }
      } else {
        await rawDb.suppliers.add({
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

  // Sync Customers
  if (pullResult.customers) {
    const pulledCustomerIds = new Set(pullResult.customers.map((c: any) => c.id));
    const currentCustomers = await rawDb.customers.toArray();

    for (const localCustomer of currentCustomers) {
      if (localCustomer.id && !pulledCustomerIds.has(localCustomer.id)) {
        await rawDb.customers.delete(localCustomer.localId!);
      }
    }

    for (const c of pullResult.customers) {
      const existing = await rawDb.customers.where("name").equals(c.name).first();
      const existingOffline = await rawDb.offlineCustomers.where("name").equals(c.name).first();

      if (existing) {
        await rawDb.customers.update(existing.localId!, {
          id: c.id,
          contactName: c.contactName,
          phone: c.phone,
          email: c.email,
          address: c.address
        });
        if (existingOffline) {
          await rawDb.offlineCustomers.delete(existingOffline.localId!);
        }
      } else {
        await rawDb.customers.add({
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

  return pulled;
}

/**
 * Pushes offline catalog modifications, pulls back from server to reconcile database IDs and values,
 * and clears offline staging catalog tables.
 */
async function pushOfflineCatalog(
  since: string | null,
  offlineItems: any[],
  offlineSuppliers: any[],
  offlineCustomers: any[]
): Promise<number> {
  if (!offlineItems.length && !offlineSuppliers.length && !offlineCustomers.length) {
    return 0;
  }

  const pushCatalogPayload = {
    items: offlineItems.map((i) => ({
      name: i.name,
      description: i.description ?? undefined,
      quantity: i.quantity,
      unit: "pcs",
      lowStockThreshold: i.lowStockThreshold,
    })),
    suppliers: offlineSuppliers.map((s) => ({
      name: s.name,
      contactName: s.contactName ?? undefined,
      phone: s.phone ?? undefined,
      email: s.email ?? undefined,
      address: s.address ?? undefined,
    })),
    customers: offlineCustomers.map((c) => ({
      name: c.name,
      contactName: c.contactName ?? undefined,
      phone: c.phone ?? undefined,
      email: c.email ?? undefined,
      address: c.address ?? undefined,
    })),
    purchases: [],
    sales: [],
  };

  const result = await syncPush(pushCatalogPayload);

  // Pull back updated catalog to save database IDs & latest backend values
  const pullResult = await syncPull(since ? { since } : {});

  if (pullResult.items) {
    for (const item of pullResult.items) {
      const existing = await rawDb.items.where("name").equals(item.name).first();
      if (existing) {
        await rawDb.items.update(existing.localId!, {
          id: item.id,
          quantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
          status: item.status as any,
          description: item.description,
          updatedAt: item.updatedAt
        });
      }
    }
  }
  if (pullResult.suppliers) {
    for (const s of pullResult.suppliers) {
      const existing = await rawDb.suppliers.where("name").equals(s.name).first();
      if (existing) {
        await rawDb.suppliers.update(existing.localId!, {
          id: s.id,
          contactName: s.contactName,
          phone: s.phone,
          email: s.email,
          address: s.address
        });
      }
    }
  }
  if (pullResult.customers) {
    for (const c of pullResult.customers) {
      const existing = await rawDb.customers.where("name").equals(c.name).first();
      if (existing) {
        await rawDb.customers.update(existing.localId!, {
          id: c.id,
          contactName: c.contactName,
          phone: c.phone,
          email: c.email,
          address: c.address
        });
      }
    }
  }

  // Clear staging tables
  await Promise.all([
    rawDb.offlineItems.clear(),
    rawDb.offlineSuppliers.clear(),
    rawDb.offlineCustomers.clear(),
  ]);

  return (result.counts?.items ?? 0) +
         (result.counts?.suppliers ?? 0) +
         (result.counts?.customers ?? 0);
}

/**
 * Maps staging offline transactions to backend database IDs, pushes them,
 * and clears staging transaction tables.
 */
async function pushOfflineTransactions(
  offlinePurchases: any[],
  offlineSales: any[],
  finalItems: any[],
  finalSuppliers: any[],
  finalCustomers: any[]
): Promise<number> {
  if (!offlinePurchases.length && !offlineSales.length) {
    return 0;
  }

  const mappedPurchases = offlinePurchases
    .map((p) => {
      const dbItem = finalItems.find((i) => i.name === p.itemName);
      const dbSupplier = finalSuppliers.find((s) => s.name === p.supplierName);
      if (!dbItem?.id || !dbSupplier?.id) return null;
      return {
        itemId: dbItem.id,
        supplierId: dbSupplier.id,
        quantity: p.quantity,
        unitPrice: 0,
        notes: p.notes ?? undefined,
        date: p.date,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const mappedSales = offlineSales
    .map((s) => {
      const dbItem = finalItems.find((i) => i.name === s.itemName);
      const dbCustomer = finalCustomers.find((c) => c.name === s.customerName);
      if (!dbItem?.id || !dbCustomer?.id) return null;
      return {
        itemId: dbItem.id,
        customerId: dbCustomer.id,
        quantity: s.quantity,
        unitPrice: 0,
        notes: s.notes ?? undefined,
        date: s.date,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (!mappedPurchases.length && !mappedSales.length) {
    return 0;
  }

  const pushTxPayload = {
    items: [],
    suppliers: [],
    customers: [],
    purchases: mappedPurchases,
    sales: mappedSales,
  };
  const result = await syncPush(pushTxPayload);

  // Clear staging tables
  await Promise.all([
    rawDb.offlinePurchases.clear(),
    rawDb.offlineSales.clear(),
  ]);

  return (result.counts?.purchases ?? 0) + (result.counts?.sales ?? 0);
}

/**
 * Pulls recent purchases and sales from the backend and merges them locally.
 */
async function pullAndSyncTransactions(
  since: string | null,
  finalItems: any[],
  finalSuppliers: any[],
  finalCustomers: any[]
): Promise<number> {
  const pullResult = await syncPull(since ? { since } : {});
  let pulledCount = 0;

  if (pullResult.purchases) {
    for (const p of pullResult.purchases) {
      const localItem = finalItems.find((i) => i.id === p.itemId);
      const localSupplier = finalSuppliers.find((s) => s.id === p.supplierId);
      if (!localItem || !localSupplier) continue;

      const existing = await rawDb.purchases
        .filter(
          (lp) =>
            lp.itemId === localItem.localId &&
            lp.supplierId === localSupplier.localId &&
            lp.date === p.date &&
            lp.quantity === p.quantity
        )
        .first();

      if (existing) {
        if (existing.id !== p.id) {
          await rawDb.purchases.update(existing.localId!, { id: p.id });
        }
      } else {
        await rawDb.purchases.add({
          id: p.id,
          itemId: localItem.localId!,
          itemName: localItem.name,
          supplierId: localSupplier.localId!,
          supplierName: localSupplier.name,
          quantity: p.quantity,
          notes: p.notes ?? null,
          date: p.date,
          createdAt: p.createdAt,
        });
        pulledCount++;
      }
    }
  }

  if (pullResult.sales) {
    for (const s of pullResult.sales) {
      const localItem = finalItems.find((i) => i.id === s.itemId);
      const localCustomer = finalCustomers.find((c) => c.id === s.customerId);
      if (!localItem || !localCustomer) continue;

      const existing = await rawDb.sales
        .filter(
          (ls) =>
            ls.itemId === localItem.localId &&
            ls.customerId === localCustomer.localId &&
            ls.date === s.date &&
            ls.quantity === s.quantity
        )
        .first();

      if (existing) {
        if (existing.id !== s.id) {
          await rawDb.sales.update(existing.localId!, { id: s.id });
        }
      } else {
        await rawDb.sales.add({
          id: s.id,
          itemId: localItem.localId!,
          itemName: localItem.name,
          customerId: localCustomer.localId!,
          customerName: localCustomer.name,
          quantity: s.quantity,
          notes: s.notes ?? null,
          date: s.date,
          createdAt: s.createdAt,
        });
        pulledCount++;
      }
    }
  }

  return pulledCount;
}

// ----------------------------------------------------
// MAIN SYNC ENTRYPOINT
// ----------------------------------------------------
export async function runSync(): Promise<{ pushed: number; pulled: number }> {
  if (!navigator.onLine) throw new Error("No internet connection");

  const since = getLastSync();

  // 1. Fetch offline changes (staging data)
  const [
    offlineItems,
    offlineSuppliers,
    offlineCustomers,
    offlinePurchases,
    offlineSales
  ] = await Promise.all([
    rawDb.offlineItems.toArray(),
    rawDb.offlineSuppliers.toArray(),
    rawDb.offlineCustomers.toArray(),
    rawDb.offlinePurchases.toArray(),
    rawDb.offlineSales.toArray(),
  ]);

  let pulled = 0;
  let pushed = 0;

  // 2. Phase 1: Pull and Sync Catalog from backend (resolves deletions and handles conflict checks)
  pulled += await pullAndSyncCatalog(since);

  // 3. Phase 2: Push offline catalog adjustments to backend
  pushed += await pushOfflineCatalog(since, offlineItems, offlineSuppliers, offlineCustomers);

  // 4. Load the updated catalog mapping to resolve transaction references
  const [finalItems, finalSuppliers, finalCustomers] = await Promise.all([
    rawDb.items.toArray(),
    rawDb.suppliers.toArray(),
    rawDb.customers.toArray(),
  ]);

  // 5. Phase 3: Push offline transactions (purchases & sales) to backend
  pushed += await pushOfflineTransactions(offlinePurchases, offlineSales, finalItems, finalSuppliers, finalCustomers);

  // 6. Phase 4: Pull backend transactions back to the client
  pulled += await pullAndSyncTransactions(since, finalItems, finalSuppliers, finalCustomers);

  setLastSync(new Date().toISOString());
  return { pushed, pulled };
}
