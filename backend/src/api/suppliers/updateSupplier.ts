import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { UpdateSupplierParams, UpdateSupplierBody } from "../../models/suppliers.model.js";
import { serializeSupplier } from "./suppliers.router.js";

export async function updateSupplier(req: Request, res: Response) {
  const params = UpdateSupplierParams.safeParse({ id: req.params.id });
  const body = UpdateSupplierBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const { name } = body.data;
  if (name !== undefined) {
    const existing = await prisma.supplier.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: params.data.id },
      },
    });
    if (existing) {
      return res.status(400).json({ error: `A supplier with the name "${name}" already exists.` });
    }
  }

  const supplier = await prisma.supplier.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeSupplier(supplier));
}
