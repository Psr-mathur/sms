import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { DeletePurchaseParams } from "../../models/purchases.model";
import { computeStatus } from "../items/items.router";

export async function deletePurchase(req: Request, res: Response) {
  const params = DeletePurchaseParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.data.id },
  });

  if (purchase) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { id: purchase.itemId },
      });
      if (existing) {
        const qty = parseFloat(purchase.quantity.toString());
        const newQty = Math.max(0, parseFloat(existing.quantity.toString()) - qty);
        const threshold = parseFloat(existing.lowStockThreshold.toString());
        await tx.item.update({
          where: { id: purchase.itemId },
          data: {
            quantity: newQty,
            status: computeStatus(newQty, threshold),
            updatedAt: new Date(),
          },
        });
      }
      await tx.purchase.delete({
        where: { id: params.data.id },
      });
    });
  }

  return res.status(204).send();
}
