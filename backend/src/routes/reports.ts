import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  GetDailyReportQueryParams,
  GetMonthlyReportQueryParams,
  GetByCustomerReportQueryParams,
  GetBySupplierReportQueryParams,
} from "../validation/api.js";

export const reportsRouter = Router();

function serializePurchase(p: any) {
  return {
    id: p.id,
    itemId: p.itemId,
    itemName: p.item?.name ?? "Unknown",
    supplierId: p.supplierId,
    supplierName: p.supplier?.name ?? "Unknown",
    quantity: parseFloat(p.quantity.toString()),
    unitPrice: parseFloat(p.unitPrice.toString()),
    totalPrice: parseFloat(p.totalPrice.toString()),
    notes: p.notes ?? null,
    date: p.date.toISOString().split("T")[0],
    createdAt: p.createdAt.toISOString(),
  };
}

function serializeSale(s: any) {
  return {
    id: s.id,
    itemId: s.itemId,
    itemName: s.item?.name ?? "Unknown",
    customerId: s.customerId,
    customerName: s.customer?.name ?? "Unknown",
    quantity: parseFloat(s.quantity.toString()),
    unitPrice: parseFloat(s.unitPrice.toString()),
    totalPrice: parseFloat(s.totalPrice.toString()),
    notes: s.notes ?? null,
    date: s.date.toISOString().split("T")[0],
    createdAt: s.createdAt.toISOString(),
  };
}

reportsRouter.get("/dashboard", async (_req, res) => {
  const items = await prisma.item.findMany();
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
      value: parseFloat(p.totalPrice.toString()),
    })),
    ...recentSales.map((s) => ({
      id: `sale-${s.id}`,
      type: "sale" as const,
      description: `Sold ${parseFloat(s.quantity.toString())} ${s.item?.name ?? ""} to ${s.customer?.name ?? ""}`,
      date: s.createdAt.toISOString(),
      value: parseFloat(s.totalPrice.toString()),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const allSales = await prisma.sale.findMany();
  const itemSalesMap = new Map<number, { totalQuantity: number; totalValue: number }>();
  for (const s of allSales) {
    const existing = itemSalesMap.get(s.itemId) ?? { totalQuantity: 0, totalValue: 0 };
    itemSalesMap.set(s.itemId, {
      totalQuantity: existing.totalQuantity + parseFloat(s.quantity.toString()),
      totalValue: existing.totalValue + parseFloat(s.totalPrice.toString()),
    });
  }

  const topItems = await Promise.all(
    [...itemSalesMap.entries()].sort((a, b) => b[1].totalValue - a[1].totalValue).slice(0, 5).map(async ([itemId, data]) => {
      const item = await prisma.item.findUnique({ where: { id: itemId } });
      return { itemId, itemName: item?.name ?? "Unknown", ...data };
    })
  );

  return res.json({
    totalItems: items.length,
    inStockCount: items.filter(i => i.status === "in_stock").length,
    lowStockCount: items.filter(i => i.status === "low_stock").length,
    outOfStockCount: items.filter(i => i.status === "out_of_stock").length,
    todayPurchases: { count: todayPurchases.length, totalValue: todayPurchases.reduce((sum, p) => sum + parseFloat(p.totalPrice.toString()), 0) },
    todaySales: { count: todaySales.length, totalValue: todaySales.reduce((sum, s) => sum + parseFloat(s.totalPrice.toString()), 0) },
    recentActivity,
    topItems,
  });
});

reportsRouter.get("/daily", async (req, res) => {
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
});

reportsRouter.get("/monthly", async (req, res) => {
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
});

reportsRouter.get("/by-customer", async (req, res) => {
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
});

reportsRouter.get("/by-supplier", async (req, res) => {
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

  const supplierMap = new Map<number, { totalPurchases: number; totalValue: number; items: Map<number, { itemName: string; totalQuantity: number; totalValue: number }> }>();
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
});
