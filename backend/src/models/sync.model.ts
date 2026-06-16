import * as zod from 'zod';

/**
 * @summary Push local changes to server
 */
export const SyncPushBody = zod.object({
  "items": zod.array(zod.object({
    "name": zod.string(),
    "description": zod.string().optional(),
    "quantity": zod.number(),
    "unit": zod.string(),
    "lowStockThreshold": zod.number()
  })),
  "suppliers": zod.array(zod.object({
    "name": zod.string(),
    "contactName": zod.string().optional(),
    "phone": zod.string().optional(),
    "email": zod.string().optional(),
    "address": zod.string().optional()
  })),
  "customers": zod.array(zod.object({
    "name": zod.string(),
    "contactName": zod.string().optional(),
    "phone": zod.string().optional(),
    "email": zod.string().optional(),
    "address": zod.string().optional()
  })),
  "purchases": zod.array(zod.object({
    "itemId": zod.string(),
    "supplierId": zod.string(),
    "quantity": zod.number(),
    "notes": zod.string().optional(),
    "date": zod.coerce.date()
  })),
  "sales": zod.array(zod.object({
    "itemId": zod.string(),
    "customerId": zod.string(),
    "quantity": zod.number(),
    "notes": zod.string().optional(),
    "date": zod.coerce.date()
  }))
})

export const SyncPushResponse = zod.object({
  "success": zod.boolean(),
  "syncedAt": zod.coerce.date(),
  "counts": zod.object({
    "items": zod.number(),
    "suppliers": zod.number(),
    "customers": zod.number(),
    "purchases": zod.number(),
    "sales": zod.number()
  })
})

/**
 * @summary Pull server changes since last sync
 */
export const SyncPullQueryParams = zod.object({
  "since": zod.string().optional()
})

export const SyncPullResponse = zod.object({
  "since": zod.string().nullable(),
  "items": zod.array(zod.object({
    "id": zod.string(),
    "name": zod.string(),
    "description": zod.string().nullish(),
    "quantity": zod.number(),
    "unit": zod.string(),
    "status": zod.enum(['in_stock', 'low_stock', 'out_of_stock']),
    "lowStockThreshold": zod.number(),
    "createdAt": zod.coerce.date(),
    "updatedAt": zod.coerce.date()
  })),
  "suppliers": zod.array(zod.object({
    "id": zod.string(),
    "name": zod.string(),
    "contactName": zod.string().nullish(),
    "phone": zod.string().nullish(),
    "email": zod.string().nullish(),
    "address": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  })),
  "customers": zod.array(zod.object({
    "id": zod.string(),
    "name": zod.string(),
    "contactName": zod.string().nullish(),
    "phone": zod.string().nullish(),
    "email": zod.string().nullish(),
    "address": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  })),
  "purchases": zod.array(zod.object({
    "id": zod.string(),
    "itemId": zod.string(),
    "itemName": zod.string(),
    "supplierId": zod.string(),
    "supplierName": zod.string(),
    "quantity": zod.number(),
    "notes": zod.string().nullish(),
    "date": zod.coerce.date(),
    "createdAt": zod.coerce.date()
  })),
  "sales": zod.array(zod.object({
    "id": zod.string(),
    "itemId": zod.string(),
    "itemName": zod.string(),
    "customerId": zod.string(),
    "customerName": zod.string(),
    "quantity": zod.number(),
    "notes": zod.string().nullish(),
    "date": zod.coerce.date(),
    "createdAt": zod.coerce.date()
  }))
})
