import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ListPurchasesQueryParams } from "../../models/purchases.model";
import { serializePurchase } from "./purchases.router";

export async function listPurchases(req: Request, res: Response) {
  const query = ListPurchasesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.supplierId) conditions.supplierId = query.data.supplierId;
  if (query.data.itemId) conditions.itemId = query.data.itemId;

  if (query.data.dateFrom || query.data.dateTo) {
    conditions.date = {};
    if (query.data.dateFrom) conditions.date.gte = new Date(query.data.dateFrom);
    if (query.data.dateTo) conditions.date.lte = new Date(query.data.dateTo);
  }

  const purchases = await prisma.purchase.findMany({
    where: conditions,
    include: {
      item: true,
      supplier: true,
    },
  });
  return res.json(purchases.map(serializePurchase));
}
