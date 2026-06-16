import * as zod from 'zod';

/**
 * @summary List customers
 */
export const ListCustomersQueryParams = zod.object({
  "search": zod.coerce.string().optional()
})

export const ListCustomersResponseItem = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

export const ListCustomersResponse = zod.array(ListCustomersResponseItem)

/**
 * @summary Create a customer
 */
export const CreateCustomerBody = zod.object({
  "name": zod.string(),
  "contactName": zod.string().optional(),
  "phone": zod.string().optional(),
  "email": zod.string().optional(),
  "address": zod.string().optional()
})

/**
 * @summary Get a customer
 */
export const GetCustomerParams = zod.object({
  "id": zod.string().uuid()
})

export const GetCustomerResponse = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Update a customer
 */
export const UpdateCustomerParams = zod.object({
  "id": zod.string().uuid()
})

export const UpdateCustomerBody = zod.object({
  "name": zod.string().optional(),
  "contactName": zod.string().optional(),
  "phone": zod.string().optional(),
  "email": zod.string().optional(),
  "address": zod.string().optional()
})

export const UpdateCustomerResponse = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "contactName": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "email": zod.string().nullish(),
  "address": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a customer
 */
export const DeleteCustomerParams = zod.object({
  "id": zod.string().uuid()
})
