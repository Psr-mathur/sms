import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ListSuppliersQueryParams,
  CreateSupplierBody,
  UpdateSupplierParams,
  UpdateSupplierBody,
  DeleteSupplierParams,
  GetSupplierParams,
} from "../validation/api.js";

export const suppliersRouter = Router();

function serializeSupplier(s: any) {
  return {
    id: s.id,
    name: s.name,
    contactName: s.contactName ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

suppliersRouter.get("/", async (req, res) => {
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
});

suppliersRouter.post("/", async (req, res) => {
  const body = CreateSupplierBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const supplier = await prisma.supplier.create({
    data: body.data,
  });
  return res.status(201).json(serializeSupplier(supplier));
});

suppliersRouter.get("/:id", async (req, res) => {
  const params = GetSupplierParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.data.id },
  });
  if (!supplier) return res.status(404).json({ error: "Not found" });
  return res.json(serializeSupplier(supplier));
});

suppliersRouter.patch("/:id", async (req, res) => {
  const params = UpdateSupplierParams.safeParse({ id: parseInt(req.params.id) });
  const body = UpdateSupplierBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const supplier = await prisma.supplier.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeSupplier(supplier));
});

suppliersRouter.delete("/:id", async (req, res) => {
  const params = DeleteSupplierParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.supplier.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
});
