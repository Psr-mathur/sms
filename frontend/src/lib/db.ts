import api from './axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  status: ItemStatus;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  notes: string | null;
  date: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  customerId: string;
  customerName: string;
  quantity: number;
  notes: string | null;
  date: string;
  createdAt: string;
}

// ─── Items ───────────────────────────────────────────────────────────────────

export const itemsApi = {
  list: (params?: { search?: string; status?: ItemStatus }): Promise<Item[]> =>
    api.get('/api/items', { params }).then((r) => r.data),

  get: (id: string): Promise<Item> =>
    api.get(`/api/items/${id}`).then((r) => r.data),

  create: (body: {
    name: string;
    description?: string;
    lowStockThreshold?: number;
  }): Promise<Item> =>
    api.post('/api/items', body).then((r) => r.data),

  update: (
    id: string,
    body: Partial<{ name: string; description: string; lowStockThreshold: number }>
  ): Promise<Item> =>
    api.patch(`/api/items/${id}`, body).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/items/${id}`).then(() => undefined),
};

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: (params?: { search?: string }): Promise<Supplier[]> =>
    api.get('/api/suppliers', { params }).then((r) => r.data),

  get: (id: string): Promise<Supplier> =>
    api.get(`/api/suppliers/${id}`).then((r) => r.data),

  create: (body: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<Supplier> =>
    api.post('/api/suppliers', body).then((r) => r.data),

  update: (
    id: string,
    body: Partial<{ name: string; contactName: string; phone: string; email: string; address: string }>
  ): Promise<Supplier> =>
    api.patch(`/api/suppliers/${id}`, body).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/suppliers/${id}`).then(() => undefined),
};

// ─── Customers ───────────────────────────────────────────────────────────────

export const customersApi = {
  list: (params?: { search?: string }): Promise<Customer[]> =>
    api.get('/api/customers', { params }).then((r) => r.data),

  get: (id: string): Promise<Customer> =>
    api.get(`/api/customers/${id}`).then((r) => r.data),

  create: (body: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<Customer> =>
    api.post('/api/customers', body).then((r) => r.data),

  update: (
    id: string,
    body: Partial<{ name: string; contactName: string; phone: string; email: string; address: string }>
  ): Promise<Customer> =>
    api.patch(`/api/customers/${id}`, body).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/customers/${id}`).then(() => undefined),
};

// ─── Purchases ───────────────────────────────────────────────────────────────

export const purchasesApi = {
  list: (params?: {
    supplierId?: string;
    itemId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Purchase[]> =>
    api.get('/api/purchases', { params }).then((r) => r.data),

  get: (id: string): Promise<Purchase> =>
    api.get(`/api/purchases/${id}`).then((r) => r.data),

  create: (body: {
    itemId: string;
    supplierId: string;
    quantity: number;
    notes?: string;
    date: string;
  }): Promise<Purchase> =>
    api.post('/api/purchases', body).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/purchases/${id}`).then(() => undefined),
};

// ─── Sales ───────────────────────────────────────────────────────────────────

export const salesApi = {
  list: (params?: {
    customerId?: string;
    itemId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Sale[]> =>
    api.get('/api/sales', { params }).then((r) => r.data),

  get: (id: string): Promise<Sale> =>
    api.get(`/api/sales/${id}`).then((r) => r.data),

  create: (body: {
    itemId: string;
    customerId: string;
    quantity: number;
    notes?: string;
    date: string;
  }): Promise<Sale> =>
    api.post('/api/sales', body).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/sales/${id}`).then(() => undefined),
};
