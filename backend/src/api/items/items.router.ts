import { Router } from "express";
import { listItems } from "./listItems";
import { createItem } from "./createItem";
import { getItem } from "./getItem";
import { updateItem } from "./updateItem";
import { deleteItem } from "./deleteItem";

export const itemsRouter = Router();

export function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

export function serializeItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    quantity: parseFloat(item.quantity.toString()),
    unit: item.unit,
    status: item.status,
    lowStockThreshold: parseFloat(item.lowStockThreshold.toString()),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

itemsRouter.get("/", listItems);
itemsRouter.post("/", createItem);
itemsRouter.get("/:id", getItem);
itemsRouter.patch("/:id", updateItem);
itemsRouter.delete("/:id", deleteItem);
