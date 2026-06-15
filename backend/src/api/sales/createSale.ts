import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateSaleBody } from "../../models/sales.model.js";
import { serializeSale } from "./sales.router.js";
import { computeStatus } from "../items/items.router.js";

export async function createSale(req: Request, res: Response) {
  const body = CreateSaleBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, customerId, quantity, unitPrice, notes, date } = body.data;
  const qty = parseFloat(String(quantity));
  const price = parseFloat(String(unitPrice));
  const total = qty * price;

  try {
  // Check stock availability before creating sale (inside a transaction to prevent race conditions)
  const sale = await prisma.$transaction(async (tx) => {
    const existing = await tx.item.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw Object.assign(new Error("Item not found"), { statusCode: 404 });
    }

    const currentQty = parseFloat(existing.quantity.toString());
    if (qty > currentQty) {
      throw Object.assign(
        new Error(`Insufficient stock. Only ${currentQty} available.`),
        { statusCode: 400 }
      );
    }

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

    const newQty = currentQty - qty;
    const threshold = parseFloat(existing.lowStockThreshold.toString());
    await tx.item.update({
      where: { id: itemId },
      data: {
        quantity: newQty,
        status: computeStatus(newQty, threshold),
        updatedAt: new Date(),
      },
    });

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
  } catch (err: any) {
    const status = err.statusCode ?? 500;
    return res.status(status).json({ error: err.message ?? "Internal server error" });
  }
}
