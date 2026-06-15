import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { UpdateItemParams, UpdateItemBody } from "../../models/items.model.js";
import { serializeItem, computeStatus } from "./items.router.js";

export async function updateItem(req: Request, res: Response) {
  const params = UpdateItemParams.safeParse({ id: parseInt(String(req.params.id)) });
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
}
