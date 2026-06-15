import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { GetDailyReportQueryParams } from "../../models/reports.model";
import { serializePurchase } from "../purchases/purchases.router";
import { serializeSale } from "../sales/sales.router";

export async function getDaily(req: Request, res: Response) {
  const query = GetDailyReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const dateStr = query.data.date
    ? query.data.date.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const dateObj = new Date(dateStr);

  const purchases = await prisma.purchase.findMany({
    where: { date: dateObj },
    include: { item: true, supplier: true },
  });
  const sales = await prisma.sale.findMany({
    where: { date: dateObj },
    include: { item: true, customer: true },
  });

  const purchaseItems = purchases.map(serializePurchase);
  const saleItems = sales.map(serializeSale);

  return res.json({
    date: dateStr,
    purchases: { count: purchases.length, totalValue: purchases.reduce((s, p) => s + parseFloat(p.totalPrice.toString()), 0), items: purchaseItems },
    sales: { count: sales.length, totalValue: sales.reduce((s, sale) => s + parseFloat(sale.totalPrice.toString()), 0), items: saleItems },
  });
}
