import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ListPurchasesQueryParams,
  CreatePurchaseBody,
  GetPurchaseParams,
  DeletePurchaseParams,
} from "../validation/api.js";

export const purchasesRouter = Router();

function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

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

purchasesRouter.get("/", async (req, res) => {
  const query = ListPurchasesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.supplierId) conditions.supplierId = query.data.supplierId;
  if (query.data.itemId) conditions.itemId = query.data.itemId;

  if (query.data.dateFrom || query.data.dateTo) {
    conditions.date = {};
    if (query.data.dateFrom) conditions.date.gte = new Date(query.data.dateFrom);
    if (query.data.dateTo) conditions.date.lte = new Date(query.data.dateTo);
  }

  const purchases = await prisma.purchase.findMany({
    where: conditions,
    include: {
      item: true,
      supplier: true,
    },
  });
  return res.json(purchases.map(serializePurchase));
});

purchasesRouter.post("/", async (req, res) => {
  const body = CreatePurchaseBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, supplierId, quantity, unitPrice, notes, date } = body.data;
  const qty = parseFloat(String(quantity));
  const price = parseFloat(String(unitPrice));
  const total = qty * price;

  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.create({
      data: {
        itemId,
        supplierId,
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
      const newQty = parseFloat(existing.quantity.toString()) + qty;
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

    return p;
  });

  const reloaded = await prisma.purchase.findUnique({
    where: { id: purchase.id },
    include: {
      item: true,
      supplier: true,
    },
  });

  return res.status(201).json(serializePurchase(reloaded));
});

purchasesRouter.get("/:id", async (req, res) => {
  const params = GetPurchaseParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.data.id },
    include: {
      item: true,
      supplier: true,
    },
  });
  if (!purchase) return res.status(404).json({ error: "Not found" });
  return res.json(serializePurchase(purchase));
});

purchasesRouter.delete("/:id", async (req, res) => {
  const params = DeletePurchaseParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.data.id },
  });

  if (purchase) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { id: purchase.itemId },
      });
      if (existing) {
        const qty = parseFloat(purchase.quantity.toString());
        const newQty = Math.max(0, parseFloat(existing.quantity.toString()) - qty);
        const threshold = parseFloat(existing.lowStockThreshold.toString());
        await tx.item.update({
          where: { id: purchase.itemId },
          data: {
            quantity: newQty,
            status: computeStatus(newQty, threshold),
            updatedAt: new Date(),
          },
        });
      }
      await tx.purchase.delete({
        where: { id: params.data.id },
      });
    });
  }

  return res.status(204).send();
});
