import { Router } from "express";
import { listSuppliers } from "./listSuppliers";
import { createSupplier } from "./createSupplier";
import { getSupplier } from "./getSupplier";
import { updateSupplier } from "./updateSupplier";
import { deleteSupplier } from "./deleteSupplier";

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
