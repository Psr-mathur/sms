import * as zod from 'zod';

/**
 * @summary List sale records
 */
export const ListSalesQueryParams = zod.object({
  "customerId": zod.string().uuid().optional(),
  "itemId": zod.string().uuid().optional(),
  "dateFrom": zod.coerce.date().optional(),
  "dateTo": zod.coerce.date().optional()
})

export const ListSalesResponseItem = zod.object({
  "id": zod.string(),
  "itemId": zod.string(),
  "itemName": zod.string(),
  "customerId": zod.string(),
  "customerName": zod.string(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "totalPrice": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

export const ListSalesResponse = zod.array(ListSalesResponseItem)

/**
 * @summary Record a sale (stock out)
 */
export const CreateSaleBody = zod.object({
  "itemId": zod.string().uuid(),
  "customerId": zod.string().uuid(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "notes": zod.string().optional(),
  "date": zod.coerce.date()
})

/**
 * @summary Get a sale record
 */
export const GetSaleParams = zod.object({
  "id": zod.string().uuid()
})

export const GetSaleResponse = zod.object({
  "id": zod.string(),
  "itemId": zod.string(),
  "itemName": zod.string(),
  "customerId": zod.string(),
  "customerName": zod.string(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "totalPrice": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a sale record
 */
export const DeleteSaleParams = zod.object({
  "id": zod.string().uuid()
})
