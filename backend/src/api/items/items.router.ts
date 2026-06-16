import { Router } from "express";
import { listItems } from "./listItems.js";
import { createItem } from "./createItem.js";
import { getItem } from "./getItem.js";
import { updateItem } from "./updateItem.js";
import { deleteItem } from "./deleteItem.js";

export const itemsRouter = Router();

export function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

export function serializeItem(item: any) {
  const quantity = item.currentStock !== undefined 
    ? parseFloat(item.currentStock.toString()) 
    : (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity?.toString() ?? '0'));
  
  const status = computeStatus(quantity, parseFloat(item.lowStockThreshold.toString()));

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    quantity,
    status,
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
