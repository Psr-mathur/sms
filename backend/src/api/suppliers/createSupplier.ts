import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateSupplierBody } from "../../models/suppliers.model.js";
import { serializeSupplier } from "./suppliers.router.js";

export async function createSupplier(req: Request, res: Response) {
  const body = CreateSupplierBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const supplier = await prisma.supplier.create({
    data: body.data as any,
  });
  return res.status(201).json(serializeSupplier(supplier));
}
