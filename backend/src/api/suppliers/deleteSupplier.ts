import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { DeleteSupplierParams } from "../../models/suppliers.model.js";

export async function deleteSupplier(req: Request, res: Response) {
  const params = DeleteSupplierParams.safeParse({ id: req.params.id });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.supplier.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
}
