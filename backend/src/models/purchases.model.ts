import * as zod from 'zod';

/**
 * @summary List purchase records
 */
export const ListPurchasesQueryParams = zod.object({
  "supplierId": zod.string().uuid().optional(),
  "itemId": zod.string().uuid().optional(),
  "dateFrom": zod.coerce.date().optional(),
  "dateTo": zod.coerce.date().optional()
})

export const ListPurchasesResponseItem = zod.object({
  "id": zod.string(),
  "itemId": zod.string(),
  "itemName": zod.string(),
  "supplierId": zod.string(),
  "supplierName": zod.string(),
  "quantity": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

export const ListPurchasesResponse = zod.array(ListPurchasesResponseItem)

/**
 * @summary Record a purchase (stock in)
 */
export const CreatePurchaseBody = zod.object({
  "itemId": zod.string().uuid(),
  "supplierId": zod.string().uuid(),
  "quantity": zod.number(),
  "notes": zod.string().optional(),
  "date": zod.coerce.date()
})

/**
 * @summary Get a purchase record
 */
export const GetPurchaseParams = zod.object({
  "id": zod.string().uuid()
})

export const GetPurchaseResponse = zod.object({
  "id": zod.string(),
  "itemId": zod.string(),
  "itemName": zod.string(),
  "supplierId": zod.string(),
  "supplierName": zod.string(),
  "quantity": zod.number(),
  "notes": zod.string().nullish(),
  "date": zod.coerce.date(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a purchase record
 */
export const DeletePurchaseParams = zod.object({
  "id": zod.string().uuid()
})
