import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetBySupplierReportQueryParams } from "../../models/reports.model.js";

export async function getBySupplier(req: Request, res: Response) {
  const query = GetBySupplierReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.dateFrom || query.data.dateTo) {
    conditions.date = {};
    if (query.data.dateFrom) conditions.date.gte = new Date(query.data.dateFrom);
    if (query.data.dateTo) conditions.date.lte = new Date(query.data.dateTo);
  }

  const purchases = await prisma.purchase.findMany({
    where: conditions,
    include: { item: true },
  });
  const suppliers = await prisma.supplier.findMany();

  const supplierMap = new Map<string, { totalPurchases: number; totalValue: number; items: Map<string, { itemName: string; totalQuantity: number; totalValue: number }> }>();
  for (const p of purchases) {
    const existing = supplierMap.get(p.supplierId) ?? { totalPurchases: 0, totalValue: 0, items: new Map() };
    const existingItem = existing.items.get(p.itemId) ?? { itemName: p.item?.name ?? "Unknown", totalQuantity: 0, totalValue: 0 };
    existing.items.set(p.itemId, { ...existingItem, totalQuantity: existingItem.totalQuantity + parseFloat(p.quantity.toString()), totalValue: existingItem.totalValue + parseFloat(p.totalPrice.toString()) });
    supplierMap.set(p.supplierId, { totalPurchases: existing.totalPurchases + 1, totalValue: existing.totalValue + parseFloat(p.totalPrice.toString()), items: existing.items });
  }

  const result = suppliers.filter(s => supplierMap.has(s.id)).map(s => {
    const data = supplierMap.get(s.id)!;
    return {
      supplierId: s.id, supplierName: s.name,
      totalPurchases: data.totalPurchases, totalValue: data.totalValue,
      items: [...data.items.entries()].map(([itemId, d]) => ({ itemId, ...d })),
    };
  });

  return res.json(result.sort((a, b) => b.totalValue - a.totalValue));
}
