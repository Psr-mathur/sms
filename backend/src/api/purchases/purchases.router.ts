import { Router } from "express";
import { listPurchases } from "./listPurchases.js";
import { createPurchase } from "./createPurchase.js";
import { getPurchase } from "./getPurchase.js";
import { deletePurchase } from "./deletePurchase.js";

export const purchasesRouter = Router();

export function serializePurchase(p: any) {
  return {
    id: p.id,
    itemId: p.itemId,
    itemName: p.item?.name ?? "Unknown",
    supplierId: p.supplierId,
    supplierName: p.supplier?.name ?? "Unknown",
    quantity: parseFloat(p.quantity.toString()),
    unitPrice: parseFloat(p.unitPrice.toString()),
    totalPrice: parseFloat(p.totalPrice.toString()),
    notes: p.notes ?? null,
    date: p.date.toISOString().split("T")[0],
    createdAt: p.createdAt.toISOString(),
  };
}

purchasesRouter.get("/", listPurchases);
purchasesRouter.post("/", createPurchase);
purchasesRouter.get("/:id", getPurchase);
purchasesRouter.delete("/:id", deletePurchase);
