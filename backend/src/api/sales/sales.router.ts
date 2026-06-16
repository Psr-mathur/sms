import { Router } from "express";
import { listSales } from "./listSales.js";
import { createSale } from "./createSale.js";
import { getSale } from "./getSale.js";
import { deleteSale } from "./deleteSale.js";

export const salesRouter = Router();

export function serializeSale(s: any) {
  return {
    id: s.id,
    itemId: s.itemId,
    itemName: s.item?.name ?? "Unknown",
    customerId: s.customerId,
    customerName: s.customer?.name ?? "Unknown",
    quantity: parseFloat(s.quantity.toString()),
    notes: s.notes ?? null,
    date: s.date.toISOString().split("T")[0],
    createdAt: s.createdAt.toISOString(),
  };
}

salesRouter.get("/", listSales);
salesRouter.post("/", createSale);
salesRouter.get("/:id", getSale);
salesRouter.delete("/:id", deleteSale);
