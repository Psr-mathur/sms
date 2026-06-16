import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { DeletePurchaseParams } from "../../models/purchases.model.js";
import { computeStatus } from "../items/items.router.js";

export async function deletePurchase(req: Request, res: Response) {
  const params = DeletePurchaseParams.safeParse({ id: req.params.id });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.data.id },
  });

  if (purchase) {
    await prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: purchase.itemId },
        data: {
          updatedAt: new Date(),
        },
      });
      await tx.purchase.delete({
        where: { id: params.data.id },
      });
    });
  }

  return res.status(204).send();
}
