import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { computeStatus } from "../items/items.router.js";

export async function getDashboard(_req: Request, res: Response) {
  const items = await prisma.item.findMany();

  const computedItems = items.map(item => {
    const qty = parseFloat(item.currentStock.toString());
    const status = computeStatus(qty, parseFloat(item.lowStockThreshold.toString()));
    return { ...item, quantity: qty, status };
  });
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayDateStr);

  const todayPurchases = await prisma.purchase.findMany({
    where: { date: todayDate },
  });
  const todaySales = await prisma.sale.findMany({
    where: { date: todayDate },
  });

  const recentPurchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { item: true, supplier: true },
  });
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { item: true, customer: true },
  });

  const recentActivity = [
    ...recentPurchases.map((p) => ({
      id: `purchase-${p.id}`,
      type: "purchase" as const,
      description: `Purchased ${parseFloat(p.quantity.toString())} ${p.item?.name ?? ""} from ${p.supplier?.name ?? ""}`,
      date: p.createdAt.toISOString(),
    })),
    ...recentSales.map((s) => ({
      id: `sale-${s.id}`,
      type: "sale" as const,
      description: `Sold ${parseFloat(s.quantity.toString())} ${s.item?.name ?? ""} to ${s.customer?.name ?? ""}`,
      date: s.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const allSales = await prisma.sale.findMany();
  const itemSalesMap = new Map<string, { totalQuantity: number }>();
  for (const s of allSales) {
    const existing = itemSalesMap.get(s.itemId) ?? { totalQuantity: 0 };
    itemSalesMap.set(s.itemId, {
      totalQuantity: existing.totalQuantity + parseFloat(s.quantity.toString()),
    });
  }

  const topItems = await Promise.all(
    [...itemSalesMap.entries()].sort((a, b) => b[1].totalQuantity - a[1].totalQuantity).slice(0, 5).map(async ([itemId, data]) => {
      const item = await prisma.item.findUnique({ where: { id: itemId } });
      return { itemId, itemName: item?.name ?? "Unknown", ...data };
    })
  );

  return res.json({
    totalItems: items.length,
    inStockCount: computedItems.filter(i => i.status === "in_stock").length,
    lowStockCount: computedItems.filter(i => i.status === "low_stock").length,
    outOfStockCount: computedItems.filter(i => i.status === "out_of_stock").length,
    todayPurchases: { count: todayPurchases.length },
    todaySales: { count: todaySales.length },
    recentActivity,
    topItems,
  });
}
