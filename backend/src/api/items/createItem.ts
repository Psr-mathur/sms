import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateItemBody } from "../../models/items.model.js";
import { serializeItem, computeStatus } from "./items.router.js";

export async function createItem(req: Request, res: Response) {
  const body = CreateItemBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { name, description, lowStockThreshold } = body.data;

  const existingItem = await prisma.item.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existingItem) {
    return res.status(400).json({ error: `An item with the name "${name}" already exists.` });
  }

  const threshold = parseFloat(String(lowStockThreshold ?? 5));

  const item = await prisma.item.create({
    data: {
      name,
      description: description ?? null,
      lowStockThreshold: threshold,
    },
  });

  const qty = 0;
  const status = computeStatus(qty, threshold);

  const itemWithQty = {
    ...item,
    quantity: qty,
    status
  };

  return res.status(201).json(serializeItem(itemWithQty));
}
