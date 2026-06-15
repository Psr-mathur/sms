import { Router } from "express";
import { listCustomers } from "./listCustomers";
import { createCustomer } from "./createCustomer";
import { getCustomer } from "./getCustomer";
import { updateCustomer } from "./updateCustomer";
import { deleteCustomer } from "./deleteCustomer";

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
