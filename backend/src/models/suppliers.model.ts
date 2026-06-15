import * as zod from 'zod';

/**
 * @summary List suppliers
 */
export const ListSuppliersQueryParams = zod.object({
  "search": zod.coerce.string().optional()
})

export const ListSuppliersResponseItem = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

export const ListSuppliersResponse = zod.array(ListSuppliersResponseItem)

/**
 * @summary Create a supplier
 */
export const CreateSupplierBody = zod.object({
  "name": zod.string(),
  "contactName": zod.string().optional(),
  "phone": zod.string().optional(),
  "email": zod.string().optional(),
  "address": zod.string().optional()
})

/**
 * @summary Get a supplier
 */
export const GetSupplierParams = zod.object({
  "id": zod.coerce.number()
})

export const GetSupplierResponse = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Update a supplier
 */
export const UpdateSupplierParams = zod.object({
  "id": zod.coerce.number()
})

export const UpdateSupplierBody = zod.object({
  "name": zod.string().optional(),
  "contactName": zod.string().optional(),
  "phone": zod.string().optional(),
  "email": zod.string().optional(),
  "address": zod.string().optional()
})

export const UpdateSupplierResponse = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a supplier
 */
export const DeleteSupplierParams = zod.object({
  "id": zod.coerce.number()
})
