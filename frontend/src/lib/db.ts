import Dexie, { type EntityTable } from 'dexie';

export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface LocalItem {
  localId?: number;
  id?: number | null;
  name: string;
  description?: string | null;
  quantity: number;
  status: ItemStatus;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSupplier {
  localId?: number;
  id?: number | null;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface LocalCustomer {
  localId?: number;
  id?: number | null;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface LocalPurchase {
  localId?: number;
  id?: number | null;
  itemId: number;
  itemName: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  notes?: string | null;
  date: string;
  createdAt: string;
}

export interface LocalSale {
  localId?: number;
  id?: number | null;
  itemId: number;
  itemName: string;
  customerId: number;
  customerName: string;
  quantity: number;
  notes?: string | null;
  date: string;
  createdAt: string;
}

// Raw Dexie DB instance
const rawDb = new Dexie('StockManagerDB') as Dexie & {
  items: EntityTable<LocalItem, 'localId'>;
  offlineItems: EntityTable<LocalItem & { overridesLocalId?: number }, 'localId'>;
  suppliers: EntityTable<LocalSupplier, 'localId'>;
  offlineSuppliers: EntityTable<LocalSupplier & { overridesLocalId?: number }, 'localId'>;
  customers: EntityTable<LocalCustomer, 'localId'>;
  offlineCustomers: EntityTable<LocalCustomer & { overridesLocalId?: number }, 'localId'>;
  purchases: EntityTable<LocalPurchase, 'localId'>;
  offlinePurchases: EntityTable<LocalPurchase, 'localId'>;
  sales: EntityTable<LocalSale, 'localId'>;
  offlineSales: EntityTable<LocalSale, 'localId'>;
};

// Version 1 Schema
rawDb.version(1).stores({
  items: '++localId, id, name, status, createdAt, updatedAt',
  suppliers: '++localId, id, name, createdAt',
  customers: '++localId, id, name, createdAt',
  purchases: '++localId, id, itemId, supplierId, date, createdAt',
  sales: '++localId, id, itemId, customerId, date, createdAt',
});

// Version 2 Schema (Adding offline staging tables)
rawDb.version(2).stores({
  items: '++localId, id, name, status, createdAt, updatedAt',
  offlineItems: '++localId, id, name, status, overridesLocalId, createdAt, updatedAt',
  suppliers: '++localId, id, name, createdAt',
  offlineSuppliers: '++localId, id, name, overridesLocalId, createdAt',
  customers: '++localId, id, name, createdAt',
  offlineCustomers: '++localId, id, name, overridesLocalId, createdAt',
  purchases: '++localId, id, itemId, supplierId, date, createdAt',
  offlinePurchases: '++localId, id, itemId, supplierId, date, createdAt',
  sales: '++localId, id, itemId, customerId, date, createdAt',
  offlineSales: '++localId, id, itemId, customerId, date, createdAt',
});

export class MergedQuery<T> {
  constructor(private fetchFn: () => Promise<T[]>) {}

  async toArray(): Promise<T[]> {
    return this.fetchFn();
  }

  reverse(): MergedQuery<T> {
    return new MergedQuery(async () => {
      const arr = await this.fetchFn();
      return [...arr].reverse();
    });
  }

  async first(): Promise<T | undefined> {
    const arr = await this.fetchFn();
    return arr[0];
  }
}

export class MergedTable<
  T extends { localId?: number; id?: number | null; name?: string; date?: string },
  TOffline extends T & { overridesLocalId?: number } = T & { overridesLocalId?: number }
> {
  constructor(
    private syncedTable: Dexie.Table<any, any>,
    private offlineTable: Dexie.Table<any, any>,
    private isCatalog: boolean
  ) {}

  private async getMerged(): Promise<T[]> {
    const synced = await this.syncedTable.toArray();
    const offline = await this.offlineTable.toArray();

    if (this.isCatalog) {
      const map = new Map<number, T>();
      for (const item of synced) {
        if (item.localId) {
          map.set(item.localId, item);
        }
      }

      for (const off of offline) {
        if (off.overridesLocalId) {
          const mergedItem = {
            ...off,
            localId: off.overridesLocalId,
          };
          delete (mergedItem as any).overridesLocalId;
          map.set(off.overridesLocalId, mergedItem as unknown as T);
        } else {
          const mergedItem = {
            ...off,
            localId: -off.localId!,
          };
          map.set(-off.localId!, mergedItem as unknown as T);
        }
      }

      return Array.from(map.values());
    } else {
      const mappedOffline = offline.map((off) => ({
        ...off,
        localId: -off.localId!,
      }));
      return [...synced, ...mappedOffline] as T[];
    }
  }

  async toArray(): Promise<T[]> {
    return this.getMerged();
  }

  orderBy(key: string): MergedQuery<T> {
    return new MergedQuery(async () => {
      const arr = await this.getMerged();
      return arr.sort((a: any, b: any) => {
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB);
        }
        return valA < valB ? -1 : 1;
      });
    });
  }

  where(key: string) {
    return {
      equals: (value: any): MergedQuery<T> => {
        return new MergedQuery(async () => {
          const arr = await this.getMerged();
          return arr.filter((item: any) => item[key] === value);
        });
      },
      between: (lower: any, upper: any, includeLower = true, includeUpper = true): MergedQuery<T> => {
        return new MergedQuery(async () => {
          const arr = await this.getMerged();
          return arr.filter((item: any) => {
            const val = item[key];
            if (val === undefined || val === null) return false;
            const satisfyLower = includeLower ? val >= lower : val > lower;
            const satisfyUpper = includeUpper ? val <= upper : val < upper;
            return satisfyLower && satisfyUpper;
          });
        });
      }
    };
  }

  async add(entity: T): Promise<number> {
    const copy = { ...entity };
    delete copy.localId;
    const offlineLocalId = await this.offlineTable.add(copy as any);
    return -offlineLocalId;
  }

  async update(localId: number, changes: Partial<T>): Promise<number> {
    if (localId < 0) {
      const offlineId = Math.abs(localId);
      const success = await this.offlineTable.update(offlineId, changes as any);
      return success ? 1 : 0;
    } else {
      const existingOverride = await this.offlineTable
        .where('overridesLocalId')
        .equals(localId)
        .first();

      if (existingOverride) {
        const success = await this.offlineTable.update(existingOverride.localId!, changes as any);
        return success ? 1 : 0;
      } else {
        const syncedRecord = await this.syncedTable.get(localId);
        if (!syncedRecord) {
          throw new Error(`Synced record not found for update: ${localId}`);
        }
        const newOverride = {
          ...syncedRecord,
          ...changes,
          overridesLocalId: localId,
        };
        delete newOverride.localId;
        await this.offlineTable.add(newOverride as any);
        return 1;
      }
    }
  }

  async delete(localId: number): Promise<void> {
    if (localId < 0) {
      const offlineId = Math.abs(localId);
      await this.offlineTable.delete(offlineId);
    } else {
      const existingOverride = await this.offlineTable
        .where('overridesLocalId')
        .equals(localId)
        .first();
      if (existingOverride) {
        await this.offlineTable.delete(existingOverride.localId!);
      }
      await this.syncedTable.delete(localId);
    }
  }
}

const db = {
  items: new MergedTable<LocalItem>(rawDb.items, rawDb.offlineItems, true),
  suppliers: new MergedTable<LocalSupplier>(rawDb.suppliers, rawDb.offlineSuppliers, true),
  customers: new MergedTable<LocalCustomer>(rawDb.customers, rawDb.offlineCustomers, true),
  purchases: new MergedTable<LocalPurchase>(rawDb.purchases, rawDb.offlinePurchases, false),
  sales: new MergedTable<LocalSale>(rawDb.sales, rawDb.offlineSales, false),
};

export { db, rawDb };
