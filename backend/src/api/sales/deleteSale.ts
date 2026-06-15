import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { DeleteSaleParams } from "../../models/sales.model.js";
import { computeStatus } from "../items/items.router.js";

export async function deleteSale(req: Request, res: Response) {
  const params = DeleteSaleParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const sale = await prisma.sale.findUnique({
    where: { id: params.data.id },
  });

  if (sale) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { id: sale.itemId },
      });
      if (existing) {
        const qty = parseFloat(sale.quantity.toString());
        const newQty = parseFloat(existing.quantity.toString()) + qty;
        const threshold = parseFloat(existing.lowStockThreshold.toString());
        await tx.item.update({
          where: { id: sale.itemId },
          data: {
            quantity: newQty,
            status: computeStatus(newQty, threshold),
            updatedAt: new Date(),
          },
        });
      }
      await tx.sale.delete({
        where: { id: params.data.id },
      });
    });
  }

  return res.status(204).send();
}
