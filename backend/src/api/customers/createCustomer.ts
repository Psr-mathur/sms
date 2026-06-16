import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { CreateCustomerBody } from "../../models/customers.model.js";
import { serializeCustomer } from "./customers.router.js";

export async function createCustomer(req: Request, res: Response) {
  const body = CreateCustomerBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const { name } = body.data;
  const existing = await prisma.customer.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) {
    return res.status(400).json({ error: `A customer with the name "${name}" already exists.` });
  }

  const customer = await prisma.customer.create({
    data: body.data as any,
  });
  return res.status(201).json(serializeCustomer(customer));
}
