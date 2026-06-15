/**
 * Centralized TanStack Query key factory.
 * All query keys are defined here as functions returning readonly tuples.
 * This ensures consistent cache invalidation across the app.
 */

export const queryKeys = {
  // ─── Items ──────────────────────────────────────────────────────────────
  items: {
    all: () => ["items"] as const,
    list: (filters?: { search?: string; status?: string }) =>
      ["items", "list", filters] as const,
  },

  // ─── Suppliers ──────────────────────────────────────────────────────────
  suppliers: {
    all: () => ["suppliers"] as const,
    list: (filters?: { search?: string }) =>
      ["suppliers", "list", filters] as const,
  },

  // ─── Customers ──────────────────────────────────────────────────────────
  customers: {
    all: () => ["customers"] as const,
    list: (filters?: { search?: string }) =>
      ["customers", "list", filters] as const,
  },

  // ─── Purchases ──────────────────────────────────────────────────────────
  purchases: {
    all: () => ["purchases"] as const,
    list: (filters?: { dateFrom?: string; dateTo?: string; supplierId?: number; itemId?: number }) =>
      ["purchases", "list", filters] as const,
  },

  // ─── Sales ──────────────────────────────────────────────────────────────
  sales: {
    all: () => ["sales"] as const,
    list: (filters?: { dateFrom?: string; dateTo?: string; customerId?: number; itemId?: number }) =>
      ["sales", "list", filters] as const,
  },
} as const;
