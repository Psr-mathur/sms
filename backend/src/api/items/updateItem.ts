import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { UpdateItemParams, UpdateItemBody } from "../../models/items.model.js";
import { serializeItem, computeStatus } from "./items.router.js";

export async function updateItem(req: Request, res: Response) {
  const params = UpdateItemParams.safeParse({ id: req.params.id });
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const existing = await prisma.item.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updates: any = {};
  const data = body.data;
  if (data.name !== undefined) {
    const existingWithName = await prisma.item.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: params.data.id },
      },
    });
    if (existingWithName) {
      return res.status(400).json({ error: `An item with the name "${data.name}" already exists.` });
    }
    updates.name = data.name;
  }
  if (data.description !== undefined) updates.description = data.description;

  if (data.lowStockThreshold !== undefined) {
    updates.lowStockThreshold = parseFloat(String(data.lowStockThreshold));
  }
  updates.updatedAt = new Date();

  const item = await prisma.item.update({
    where: { id: params.data.id },
    data: updates,
  });

  return res.json(serializeItem(item));
}
