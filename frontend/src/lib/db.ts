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

const db = new Dexie('StockManagerDB') as Dexie & {
  items: EntityTable<LocalItem, 'localId'>;
  suppliers: EntityTable<LocalSupplier, 'localId'>;
  customers: EntityTable<LocalCustomer, 'localId'>;
  purchases: EntityTable<LocalPurchase, 'localId'>;
  sales: EntityTable<LocalSale, 'localId'>;
};

db.version(1).stores({
  items: '++localId, id, name, status, createdAt, updatedAt',
  suppliers: '++localId, id, name, createdAt',
  customers: '++localId, id, name, createdAt',
  purchases: '++localId, id, itemId, supplierId, date, createdAt',
  sales: '++localId, id, itemId, customerId, date, createdAt',
});

export { db };
