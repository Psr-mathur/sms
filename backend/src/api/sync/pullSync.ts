import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { SyncPullQueryParams } from "../../models/sync.model";

export async function pullSync(req: Request, res: Response) {
  const query = SyncPullQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const since = query.data.since ? new Date(query.data.since) : null;

  const items = await prisma.item.findMany();
  const suppliers = await prisma.supplier.findMany();
  const customers = await prisma.customer.findMany();

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
}
