import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ListItemsQueryParams,
  CreateItemBody,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
  GetItemParams,
} from "../validation/api.js";

export const itemsRouter = Router();

function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

function serializeItem(item: any) {
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

itemsRouter.get("/", async (req, res) => {
  const query = ListItemsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });

  const { search, status } = query.data;
  const conditions: any = {};
  if (search) {
    conditions.name = {
      contains: search,
      mode: "insensitive",
    };
  }
  if (status) {
    conditions.status = status;
  }

  const items = await prisma.item.findMany({
    where: conditions,
  });
  return res.json(items.map(serializeItem));
});

itemsRouter.post("/", async (req, res) => {
  const body = CreateItemBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { name, description, quantity, unit, lowStockThreshold } = body.data;
  const qty = parseFloat(String(quantity ?? 0));
  const threshold = parseFloat(String(lowStockThreshold ?? 5));
  const status = computeStatus(qty, threshold);

  const item = await prisma.item.create({
    data: {
      name,
      description: description ?? null,
      quantity: qty,
      unit: unit ?? "units",
      status,
      lowStockThreshold: threshold,
    },
  });

  return res.status(201).json(serializeItem(item));
});

itemsRouter.get("/:id", async (req, res) => {
  const params = GetItemParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const item = await prisma.item.findUnique({
    where: { id: params.data.id },
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  return res.json(serializeItem(item));
});

itemsRouter.patch("/:id", async (req, res) => {
  const params = UpdateItemParams.safeParse({ id: parseInt(req.params.id) });
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const existing = await prisma.item.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updates: any = {};
  const data = body.data;
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.unit !== undefined) updates.unit = data.unit;

  const qty = data.quantity !== undefined ? parseFloat(String(data.quantity)) : parseFloat(existing.quantity.toString());
  const threshold = data.lowStockThreshold !== undefined ? parseFloat(String(data.lowStockThreshold)) : parseFloat(existing.lowStockThreshold.toString());

  updates.quantity = qty;
  updates.lowStockThreshold = threshold;
  updates.status = computeStatus(qty, threshold);
  updates.updatedAt = new Date();

  const item = await prisma.item.update({
    where: { id: params.data.id },
    data: updates,
  });
  return res.json(serializeItem(item));
});

itemsRouter.delete("/:id", async (req, res) => {
  const params = DeleteItemParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.item.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
});
