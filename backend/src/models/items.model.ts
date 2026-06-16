import * as zod from 'zod';

/**
 * @summary List all stock items
 */
export const ListItemsQueryParams = zod.object({
  "search": zod.coerce.string().optional(),
  "status": zod.enum(['in_stock', 'low_stock', 'out_of_stock']).optional()
})

export const ListItemsResponseItem = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "description": zod.string().nullish(),
  "quantity": zod.number(),
  "status": zod.enum(['in_stock', 'low_stock', 'out_of_stock']),
  "lowStockThreshold": zod.number(),
  "createdAt": zod.coerce.date(),
  "updatedAt": zod.coerce.date()
})

export const ListItemsResponse = zod.array(ListItemsResponseItem)

/**
 * @summary Create a stock item
 */
export const CreateItemBody = zod.object({
  "name": zod.string(),
  "description": zod.string().optional(),
  "lowStockThreshold": zod.number().optional()
})

/**
 * @summary Get a stock item
 */
export const GetItemParams = zod.object({
  "id": zod.string().uuid()
})

export const GetItemResponse = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "description": zod.string().nullish(),
  "quantity": zod.number(),
  "status": zod.enum(['in_stock', 'low_stock', 'out_of_stock']),
  "lowStockThreshold": zod.number(),
  "createdAt": zod.coerce.date(),
  "updatedAt": zod.coerce.date()
})

/**
 * @summary Update a stock item
 */
export const UpdateItemParams = zod.object({
  "id": zod.string().uuid()
})

export const UpdateItemBody = zod.object({
  "name": zod.string().optional(),
  "description": zod.string().optional(),
  "lowStockThreshold": zod.number().optional()
})

export const UpdateItemResponse = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "description": zod.string().nullish(),
  "quantity": zod.number(),
  "status": zod.enum(['in_stock', 'low_stock', 'out_of_stock']),
  "lowStockThreshold": zod.number(),
  "createdAt": zod.coerce.date(),
  "updatedAt": zod.coerce.date()
})

/**
 * @summary Delete a stock item
 */
export const DeleteItemParams = zod.object({
  "id": zod.string().uuid()
})
