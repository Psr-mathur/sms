import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetSupplierParams } from "../../models/suppliers.model.js";
import { serializeSupplier } from "./suppliers.router.js";

export async function getSupplier(req: Request, res: Response) {
  const params = GetSupplierParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.data.id },
  });
  if (!supplier) return res.status(404).json({ error: "Not found" });
  return res.json(serializeSupplier(supplier));
}
