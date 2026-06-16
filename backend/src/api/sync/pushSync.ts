import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { SyncPushBody } from "../../models/sync.model.js";
import { computeStatus } from "../items/items.router.js";

export async function pushSync(req: Request, res: Response) {
  const body = SyncPushBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { items, suppliers, customers, purchases, sales } = body.data;
  const counts = { items: 0, suppliers: 0, customers: 0, purchases: 0, sales: 0 };

  // Insert items
  for (const item of items) {
    const threshold = parseFloat(String(item.lowStockThreshold ?? 5));

    const existing = await prisma.item.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.item.update({
        where: { id: existing.id },
        data: {
          description: item.description ?? null,
          lowStockThreshold: threshold,
        },
      });
    } else {
      await prisma.item.create({
        data: {
          name: item.name,
          description: item.description ?? null,
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
    if (existing) {
      await prisma.supplier.update({
        where: { id: existing.id },
        data: {
          contactName: supplier.contactName ?? null,
          phone: supplier.phone ?? null,
          email: supplier.email ?? null,
          address: supplier.address ?? null,
        },
      });
    } else {
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
    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          contactName: customer.contactName ?? null,
          phone: customer.phone ?? null,
          email: customer.email ?? null,
          address: customer.address ?? null,
        },
      });
    } else {
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
    await prisma.purchase.create({
      data: {
        itemId: purchase.itemId,
        supplierId: purchase.supplierId,
        quantity: qty,
        notes: purchase.notes ?? null,
        date: new Date(purchase.date),
      },
    });
    counts.purchases++;
  }

  // Insert sales
  for (const sale of sales) {
    const qty = parseFloat(String(sale.quantity));
    await prisma.sale.create({
      data: {
        itemId: sale.itemId,
        customerId: sale.customerId,
        quantity: qty,
        notes: sale.notes ?? null,
        date: new Date(sale.date),
      },
    });
    counts.sales++;
  }

  return res.json({ success: true, syncedAt: new Date().toISOString(), counts });
}
