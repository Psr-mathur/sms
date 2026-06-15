import * as zod from 'zod';

/**
 * @summary List purchase records
 */
export const ListPurchasesQueryParams = zod.object({
  "supplierId": zod.coerce.number().optional(),
  "itemId": zod.coerce.number().optional(),
  "dateFrom": zod.date().optional(),
  "dateTo": zod.date().optional()
})

export const ListPurchasesResponseItem = zod.object({
  "id": zod.number(),
  "itemId": zod.number(),
  "itemName": zod.string(),
  "supplierId": zod.number(),
  "supplierName": zod.string(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "totalPrice": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

export const ListPurchasesResponse = zod.array(ListPurchasesResponseItem)

/**
 * @summary Record a purchase (stock in)
 */
export const CreatePurchaseBody = zod.object({
  "itemId": zod.number(),
  "supplierId": zod.number(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "notes": zod.string().optional(),
  "date": zod.coerce.date()
})

/**
 * @summary Get a purchase record
 */
export const GetPurchaseParams = zod.object({
  "id": zod.coerce.number()
})

export const GetPurchaseResponse = zod.object({
  "id": zod.number(),
  "itemId": zod.number(),
  "itemName": zod.string(),
  "supplierId": zod.number(),
  "supplierName": zod.string(),
  "quantity": zod.number(),
  "unitPrice": zod.number(),
  "totalPrice": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a purchase record
 */
export const DeletePurchaseParams = zod.object({
  "id": zod.coerce.number()
})
