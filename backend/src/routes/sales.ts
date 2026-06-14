import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ListSalesQueryParams,
  CreateSaleBody,
  GetSaleParams,
  DeleteSaleParams,
} from "../validation/api.js";

export const salesRouter = Router();

function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
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

salesRouter.get("/", async (req, res) => {
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
});

salesRouter.post("/", async (req, res) => {
  const body = CreateSaleBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, customerId, quantity, unitPrice, notes, date } = body.data;
  const qty = parseFloat(String(quantity));
  const price = parseFloat(String(unitPrice));
  const total = qty * price;

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        itemId,
        customerId,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: notes ?? null,
        date: new Date(date),
      },
    });

    const existing = await tx.item.findUnique({
      where: { id: itemId },
    });
    if (existing) {
      const newQty = Math.max(0, parseFloat(existing.quantity.toString()) - qty);
      const threshold = parseFloat(existing.lowStockThreshold.toString());
      await tx.item.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          status: computeStatus(newQty, threshold),
          updatedAt: new Date(),
        },
      });
    }

    return s;
  });

  const reloaded = await prisma.sale.findUnique({
    where: { id: sale.id },
    include: {
      item: true,
      customer: true,
    },
  });

  return res.status(201).json(serializeSale(reloaded));
});

salesRouter.get("/:id", async (req, res) => {
  const params = GetSaleParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const sale = await prisma.sale.findUnique({
    where: { id: params.data.id },
    include: {
      item: true,
      customer: true,
    },
  });
  if (!sale) return res.status(404).json({ error: "Not found" });
  return res.json(serializeSale(sale));
});

salesRouter.delete("/:id", async (req, res) => {
  const params = DeleteSaleParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const sale = await prisma.sale.findUnique({
    where: { id: params.data.id },
  });

  if (sale) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { id: sale.itemId },
      });
      if (existing) {
        const qty = parseFloat(sale.quantity.toString());
        const newQty = parseFloat(existing.quantity.toString()) + qty;
        const threshold = parseFloat(existing.lowStockThreshold.toString());
        await tx.item.update({
          where: { id: sale.itemId },
          data: {
            quantity: newQty,
            status: computeStatus(newQty, threshold),
            updatedAt: new Date(),
          },
        });
      }
      await tx.sale.delete({
        where: { id: params.data.id },
      });
    });
  }

  return res.status(204).send();
});
