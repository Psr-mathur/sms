import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { GetByCustomerReportQueryParams } from "../../models/reports.model";

export async function getByCustomer(req: Request, res: Response) {
  const query = GetByCustomerReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.dateFrom || query.data.dateTo) {
    conditions.date = {};
    if (query.data.dateFrom) conditions.date.gte = new Date(query.data.dateFrom);
    if (query.data.dateTo) conditions.date.lte = new Date(query.data.dateTo);
  }

  const sales = await prisma.sale.findMany({
    where: conditions,
    include: { item: true },
  });
  const customers = await prisma.customer.findMany();

  const customerMap = new Map<number, { totalSales: number; totalValue: number; items: Map<number, { itemName: string; totalQuantity: number; totalValue: number }> }>();
  for (const s of sales) {
    const existing = customerMap.get(s.customerId) ?? { totalSales: 0, totalValue: 0, items: new Map() };
    const existingItem = existing.items.get(s.itemId) ?? { itemName: s.item?.name ?? "Unknown", totalQuantity: 0, totalValue: 0 };
    existing.items.set(s.itemId, { ...existingItem, totalQuantity: existingItem.totalQuantity + parseFloat(s.quantity.toString()), totalValue: existingItem.totalValue + parseFloat(s.totalPrice.toString()) });
    customerMap.set(s.customerId, { totalSales: existing.totalSales + 1, totalValue: existing.totalValue + parseFloat(s.totalPrice.toString()), items: existing.items });
  }

  const result = customers.filter(c => customerMap.has(c.id)).map(c => {
    const data = customerMap.get(c.id)!;
    return {
      customerId: c.id, customerName: c.name,
      totalSales: data.totalSales, totalValue: data.totalValue,
      items: [...data.items.entries()].map(([itemId, d]) => ({ itemId, ...d })),
    };
  });

  return res.json(result.sort((a, b) => b.totalValue - a.totalValue));
}
