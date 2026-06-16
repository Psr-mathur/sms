import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { UpdateCustomerParams, UpdateCustomerBody } from "../../models/customers.model.js";
import { serializeCustomer } from "./customers.router.js";

export async function updateCustomer(req: Request, res: Response) {
  const params = UpdateCustomerParams.safeParse({ id: req.params.id });
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const { name } = body.data;
  if (name !== undefined) {
    const existing = await prisma.customer.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: params.data.id },
      },
    });
    if (existing) {
      return res.status(400).json({ error: `A customer with the name "${name}" already exists.` });
    }
  }

  const customer = await prisma.customer.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeCustomer(customer));
}
