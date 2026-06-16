import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetSaleParams } from "../../models/sales.model.js";
import { serializeSale } from "./sales.router.js";

export async function getSale(req: Request, res: Response) {
  const params = GetSaleParams.safeParse({ id: req.params.id });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const sale = await prisma.sale.findUnique({
    where: { id: params.data.id },
    include: {
      item: true,
      customer: true,
    },
  });
  if (!sale) return res.status(404).json({ error: "Not found" });
  return res.json(serializeSale(sale));
}
