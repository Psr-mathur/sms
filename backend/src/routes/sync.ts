import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { SyncPushBody, SyncPullQueryParams } from "../validation/api.js";

export const syncRouter = Router();

function computeStatus(quantity: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

syncRouter.post("/push", async (req, res) => {
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
});

syncRouter.get("/pull", async (req, res) => {
  const query = SyncPullQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const since = query.data.since ? new Date(query.data.since) : null;

  const items = await prisma.item.findMany();
  const suppliers = await prisma.supplier.findMany();
  const customers = await prisma.customer.findMany();
  const purchases = since
    ? await prisma.purchase.findMany({ where: { createdAt: { gte: since } } })
    : await prisma.purchase.findMany();
  const sales = since
    ? await prisma.sale.findMany({ where: { createdAt: { gte: since } } })
    : await prisma.sale.findMany();

  // Eager load names for purchases/sales in mapping if needed, or query them.
  // Wait, let's load itemName and supplierName / customerName!
  // Originally, sync pull returned:
  // purchases: purchases.map(p => ({ ...p, quantity: parseFloat(p.quantity), unitPrice: parseFloat(p.unitPrice), totalPrice: parseFloat(p.totalPrice), createdAt: p.createdAt.toISOString() }))
  // Wait, does the frontend need itemName and supplierName in sync pull?
  // Let's look at the generated schemas in api.schemas.ts:
  // export interface SyncPullPayload {
  //   since: string | null;
  //   items: Item[];
  //   suppliers: Supplier[];
  //   customers: Customer[];
  //   purchases: Purchase[];
  //   sales: Sale[];
  // }
  // Yes! The type Purchase in SyncPullPayload has fields itemName and supplierName!
  // So we must fetch them! Let's do findMany with `include` in Prisma so we have item and supplier / customer names:
  const purchasesWithRelations = since
    ? await prisma.purchase.findMany({ where: { createdAt: { gte: since } }, include: { item: true, supplier: true } })
    : await prisma.purchase.findMany({ include: { item: true, supplier: true } });

  const salesWithRelations = since
    ? await prisma.sale.findMany({ where: { createdAt: { gte: since } }, include: { item: true, customer: true } })
    : await prisma.sale.findMany({ include: { item: true, customer: true } });

  return res.json({
    since: since?.toISOString() ?? null,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description ?? null,
      quantity: parseFloat(i.quantity.toString()),
      unit: i.unit,
      status: i.status,
      lowStockThreshold: parseFloat(i.lowStockThreshold.toString()),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    suppliers: suppliers.map(s => ({
      id: s.id,
      name: s.name,
      contactName: s.contactName ?? null,
      phone: s.phone ?? null,
      email: s.email ?? null,
      address: s.address ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    customers: customers.map(c => ({
      id: c.id,
      name: c.name,
      contactName: c.contactName ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    purchases: purchasesWithRelations.map(p => ({
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
    })),
    sales: salesWithRelations.map(s => ({
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
    })),
  });
});
