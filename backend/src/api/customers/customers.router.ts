import { Router } from "express";
import { listCustomers } from "./listCustomers.js";
import { createCustomer } from "./createCustomer.js";
import { getCustomer } from "./getCustomer.js";
import { updateCustomer } from "./updateCustomer.js";
import { deleteCustomer } from "./deleteCustomer.js";

export const customersRouter = Router();

export function serializeCustomer(c: any) {
  return {
    id: c.id,
    name: c.name,
    contactName: c.contactName ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

customersRouter.get("/", listCustomers);
customersRouter.post("/", createCustomer);
customersRouter.get("/:id", getCustomer);
customersRouter.patch("/:id", updateCustomer);
customersRouter.delete("/:id", deleteCustomer);
