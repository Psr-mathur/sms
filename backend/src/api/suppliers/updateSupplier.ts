import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { UpdateSupplierParams, UpdateSupplierBody } from "../../models/suppliers.model";
import { serializeSupplier } from "./suppliers.router";

export async function updateSupplier(req: Request, res: Response) {
  const params = UpdateSupplierParams.safeParse({ id: parseInt(String(req.params.id)) });
  const body = UpdateSupplierBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const supplier = await prisma.supplier.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeSupplier(supplier));
}
