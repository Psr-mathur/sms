import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetDailyReportQueryParams } from "../../models/reports.model.js";
import { serializePurchase } from "../purchases/purchases.router.js";
import { serializeSale } from "../sales/sales.router.js";

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
    purchases: { count: purchases.length, items: purchaseItems },
    sales: { count: sales.length, items: saleItems },
  });
}
