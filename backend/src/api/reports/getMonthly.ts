import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetMonthlyReportQueryParams } from "../../models/reports.model.js";

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

  const dailyMap = new Map<string, { purchaseCount: number; saleCount: number }>();
  for (const p of purchases) {
    const key = p.date.toISOString().split("T")[0];
    const existing = dailyMap.get(key) ?? { purchaseCount: 0, saleCount: 0 };
    dailyMap.set(key, { ...existing, purchaseCount: existing.purchaseCount + 1 });
  }
  for (const s of sales) {
    const key = s.date.toISOString().split("T")[0];
    const existing = dailyMap.get(key) ?? { purchaseCount: 0, saleCount: 0 };
    dailyMap.set(key, { ...existing, saleCount: existing.saleCount + 1 });
  }

  const dailyBreakdown = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, data]) => ({ date, ...data }));

  return res.json({
    year, month,
    purchases: { count: purchases.length },
    sales: { count: sales.length },
    dailyBreakdown,
  });
}
