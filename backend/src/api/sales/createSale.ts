import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateSaleBody } from "../../models/sales.model.js";
import { serializeSale } from "./sales.router.js";
import { computeStatus } from "../items/items.router.js";

export async function createSale(req: Request, res: Response) {
  const body = CreateSaleBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { itemId, customerId, quantity, notes, date } = body.data;
  const qty = parseFloat(String(quantity));

  try {
  // Check stock availability before creating sale (inside a transaction to prevent race conditions)
  const sale = await prisma.$transaction(async (tx) => {
    const existing = await tx.item.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw Object.assign(new Error("Item not found"), { statusCode: 404 });
    }

    const currentQty = parseFloat(existing.currentStock.toString());
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
        notes: notes ?? null,
        date: new Date(date),
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
    if (err.code === "P2003") {
      return res.status(400).json({ error: "The referenced Item or Customer does not exist." });
    }
    const status = err.statusCode ?? 500;
    return res.status(status).json({ error: err.message ?? "Internal server error" });
  }
}
