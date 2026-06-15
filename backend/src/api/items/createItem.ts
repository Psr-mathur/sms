import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateItemBody } from "../../models/items.model.js";
import { serializeItem, computeStatus } from "./items.router.js";

export async function createItem(req: Request, res: Response) {
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
}
