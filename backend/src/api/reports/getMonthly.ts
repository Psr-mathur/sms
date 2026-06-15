import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { GetMonthlyReportQueryParams } from "../../models/reports.model";

export async function getMonthly(req: Request, res: Response) {
  const query = GetMonthlyReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const now = new Date();
  const year = query.data.year ?? now.getFullYear();
  const month = query.data.month ?? now.getMonth() + 1;
  const dateFrom = new Date(year, month - 1, 1);
  const dateTo = new Date(year, month, 0);

  const purchases = await prisma.purchase.findMany({
    where: {
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const dailyMap = new Map<string, { purchaseCount: number; purchaseValue: number; saleCount: number; saleValue: number }>();
  for (const p of purchases) {
    const key = p.date.toISOString().split("T")[0];
    const existing = dailyMap.get(key) ?? { purchaseCount: 0, purchaseValue: 0, saleCount: 0, saleValue: 0 };
    dailyMap.set(key, { ...existing, purchaseCount: existing.purchaseCount + 1, purchaseValue: existing.purchaseValue + parseFloat(p.totalPrice.toString()) });
  }
  for (const s of sales) {
    const key = s.date.toISOString().split("T")[0];
    const existing = dailyMap.get(key) ?? { purchaseCount: 0, purchaseValue: 0, saleCount: 0, saleValue: 0 };
    dailyMap.set(key, { ...existing, saleCount: existing.saleCount + 1, saleValue: existing.saleValue + parseFloat(s.totalPrice.toString()) });
  }

  const dailyBreakdown = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, data]) => ({ date, ...data }));

  return res.json({
    year, month,
    purchases: { count: purchases.length, totalValue: purchases.reduce((s, p) => s + parseFloat(p.totalPrice.toString()), 0) },
    sales: { count: sales.length, totalValue: sales.reduce((s, sale) => s + parseFloat(sale.totalPrice.toString()), 0) },
    dailyBreakdown,
  });
}
