import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { CreatePurchaseBody } from "../../models/purchases.model";
import { serializePurchase } from "./purchases.router";
import { computeStatus } from "../items/items.router";

export async function createPurchase(req: Request, res: Response) {
  const body = CreatePurchaseBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, supplierId, quantity, unitPrice, notes, date } = body.data;
  const qty = parseFloat(String(quantity));
  const price = parseFloat(String(unitPrice));
  const total = qty * price;

  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.create({
      data: {
        itemId,
        supplierId,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: notes ?? null,
        date: new Date(date),
      },
    });

    const existing = await tx.item.findUnique({
      where: { id: itemId },
    });
    if (existing) {
      const newQty = parseFloat(existing.quantity.toString()) + qty;
      const threshold = parseFloat(existing.lowStockThreshold.toString());
      await tx.item.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          status: computeStatus(newQty, threshold),
          updatedAt: new Date(),
        },
      });
    }

    return p;
  });

  const reloaded = await prisma.purchase.findUnique({
    where: { id: purchase.id },
    include: {
      item: true,
      supplier: true,
    },
  });

  return res.status(201).json(serializePurchase(reloaded));
}
