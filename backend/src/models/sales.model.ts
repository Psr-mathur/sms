import * as zod from 'zod';

/**
 * @summary List sale records
 */
export const ListSalesQueryParams = zod.object({
  "customerId": zod.coerce.number().optional(),
  "itemId": zod.coerce.number().optional(),
  "dateFrom": zod.date().optional(),
  "dateTo": zod.date().optional()
})

export const ListSalesResponseItem = zod.object({
  "id": zod.number(),
  "itemId": zod.number(),
  "itemName": zod.string(),
  "customerId": zod.number(),
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
  "itemId": zod.number(),
  "customerId": zod.number(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "notes": zod.string().optional(),
  "date": zod.coerce.date()
})

/**
 * @summary Get a sale record
 */
export const GetSaleParams = zod.object({
  "id": zod.coerce.number()
})

export const GetSaleResponse = zod.object({
  "id": zod.number(),
  "itemId": zod.number(),
  "itemName": zod.string(),
  "customerId": zod.number(),
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
  "id": zod.coerce.number()
})
