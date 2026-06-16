import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreatePurchaseBody } from "../../models/purchases.model.js";
import { serializePurchase } from "./purchases.router.js";
import { computeStatus } from "../items/items.router.js";

export async function createPurchase(req: Request, res: Response) {
  const body = CreatePurchaseBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, supplierId, quantity, notes, date } = body.data;
  const qty = parseFloat(String(quantity));

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          itemId,
          supplierId,
          quantity: qty,
          notes: notes ?? null,
          date: new Date(date),
        },
      });

      await tx.item.update({
        where: { id: itemId },
        data: {
          updatedAt: new Date(),
        },
      });

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
  } catch (err: any) {
    if (err.code === "P2003") {
      return res.status(400).json({ error: "The referenced Item or Supplier does not exist." });
    }
    const status = err.statusCode ?? 500;
    return res.status(status).json({ error: err.message ?? "Internal server error" });
  }
}
