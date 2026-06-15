import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { SyncPushBody } from "../../models/sync.model";
import { computeStatus } from "../items/items.router";

export async function pushSync(req: Request, res: Response) {
  const body = SyncPushBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { items, suppliers, customers, purchases, sales } = body.data;
  const counts = { items: 0, suppliers: 0, customers: 0, purchases: 0, sales: 0 };

  // Insert items
  for (const item of items) {
    const qty = parseFloat(String(item.quantity ?? 0));
    const threshold = parseFloat(String(item.lowStockThreshold ?? 5));

    const existing = await prisma.item.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.item.create({
        data: {
          name: item.name,
          description: item.description ?? null,
          quantity: qty,
          unit: item.unit ?? "units",
          status: computeStatus(qty, threshold),
          lowStockThreshold: threshold,
        },
      });
    }
    counts.items++;
  }

  // Insert suppliers
  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findFirst({
      where: { name: supplier.name },
    });
    if (!existing) {
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          contactName: supplier.contactName ?? null,
          phone: supplier.phone ?? null,
          email: supplier.email ?? null,
          address: supplier.address ?? null,
        },
      });
    }
    counts.suppliers++;
  }

  // Insert customers
  for (const customer of customers) {
    const existing = await prisma.customer.findFirst({
      where: { name: customer.name },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          name: customer.name,
          contactName: customer.contactName ?? null,
          phone: customer.phone ?? null,
          email: customer.email ?? null,
          address: customer.address ?? null,
        },
      });
    }
    counts.customers++;
  }

  // Insert purchases
  for (const purchase of purchases) {
    const qty = parseFloat(String(purchase.quantity));
    const price = parseFloat(String(purchase.unitPrice));
    await prisma.purchase.create({
      data: {
        itemId: purchase.itemId,
        supplierId: purchase.supplierId,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
        notes: purchase.notes ?? null,
        date: new Date(purchase.date),
      },
    });
    counts.purchases++;
  }

  // Insert sales
  for (const sale of sales) {
    const qty = parseFloat(String(sale.quantity));
    const price = parseFloat(String(sale.unitPrice));
    await prisma.sale.create({
      data: {
        itemId: sale.itemId,
        customerId: sale.customerId,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
        notes: sale.notes ?? null,
        date: new Date(sale.date),
      },
    });
    counts.sales++;
  }

  return res.json({ success: true, syncedAt: new Date().toISOString(), counts });
}
