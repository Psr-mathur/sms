import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ListSalesQueryParams } from "../../models/sales.model";
import { serializeSale } from "./sales.router";

export async function listSales(req: Request, res: Response) {
  const query = ListSalesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.customerId) conditions.customerId = query.data.customerId;
  if (query.data.itemId) conditions.itemId = query.data.itemId;

  if (query.data.dateFrom || query.data.dateTo) {
    conditions.date = {};
    if (query.data.dateFrom) conditions.date.gte = new Date(query.data.dateFrom);
    if (query.data.dateTo) conditions.date.lte = new Date(query.data.dateTo);
  }

  const sales = await prisma.sale.findMany({
    where: conditions,
    include: {
      item: true,
      customer: true,
    },
  });
  return res.json(sales.map(serializeSale));
}
