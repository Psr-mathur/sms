import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetPurchaseParams } from "../../models/purchases.model.js";
import { serializePurchase } from "./purchases.router.js";

export async function getPurchase(req: Request, res: Response) {
  const params = GetPurchaseParams.safeParse({ id: req.params.id });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.data.id },
    include: {
      item: true,
      supplier: true,
    },
  });
  if (!purchase) return res.status(404).json({ error: "Not found" });
  return res.json(serializePurchase(purchase));
}
