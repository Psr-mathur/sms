import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerBody,
  DeleteCustomerParams,
  GetCustomerParams,
} from "../validation/api.js";

export const customersRouter = Router();

function serializeCustomer(c: any) {
  return {
    id: c.id,
    name: c.name,
    contactName: c.contactName ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

customersRouter.get("/", async (req, res) => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions: any = {};
  if (query.data.search) {
    conditions.name = {
      contains: query.data.search,
      mode: "insensitive",
    };
  }

  const customers = await prisma.customer.findMany({
    where: conditions,
  });
  return res.json(customers.map(serializeCustomer));
});

customersRouter.post("/", async (req, res) => {
  const body = CreateCustomerBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const customer = await prisma.customer.create({
    data: body.data,
  });
  return res.status(201).json(serializeCustomer(customer));
});

customersRouter.get("/:id", async (req, res) => {
  const params = GetCustomerParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const customer = await prisma.customer.findUnique({
    where: { id: params.data.id },
  });
  if (!customer) return res.status(404).json({ error: "Not found" });
  return res.json(serializeCustomer(customer));
});

customersRouter.patch("/:id", async (req, res) => {
  const params = UpdateCustomerParams.safeParse({ id: parseInt(req.params.id) });
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const customer = await prisma.customer.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeCustomer(customer));
});

customersRouter.delete("/:id", async (req, res) => {
  const params = DeleteCustomerParams.safeParse({ id: parseInt(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.customer.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
});
