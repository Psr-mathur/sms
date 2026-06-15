import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ListSuppliersQueryParams } from "../../models/suppliers.model";
import { serializeSupplier } from "./suppliers.router";

export async function listSuppliers(req: Request, res: Response) {
  const query = ListSuppliersQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.search) {
    conditions.name = {
      contains: query.data.search,
      mode: "insensitive",
    };
  }

  const suppliers = await prisma.supplier.findMany({
    where: conditions,
  });
  return res.json(suppliers.map(serializeSupplier));
}
