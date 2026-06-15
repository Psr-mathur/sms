import { Router } from "express";
import { listSuppliers } from "./listSuppliers.js";
import { createSupplier } from "./createSupplier.js";
import { getSupplier } from "./getSupplier.js";
import { updateSupplier } from "./updateSupplier.js";
import { deleteSupplier } from "./deleteSupplier.js";

export const suppliersRouter = Router();

export function serializeSupplier(s: any) {
  return {
    id: s.id,
    name: s.name,
    contactName: s.contactName ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

suppliersRouter.get("/", listSuppliers);
suppliersRouter.post("/", createSupplier);
suppliersRouter.get("/:id", getSupplier);
suppliersRouter.patch("/:id", updateSupplier);
suppliersRouter.delete("/:id", deleteSupplier);
