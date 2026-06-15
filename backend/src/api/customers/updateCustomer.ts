import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { UpdateCustomerParams, UpdateCustomerBody } from "../../models/customers.model";
import { serializeCustomer } from "./customers.router";

export async function updateCustomer(req: Request, res: Response) {
  const params = UpdateCustomerParams.safeParse({ id: parseInt(String(req.params.id)) });
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

  const customer = await prisma.customer.update({
    where: { id: params.data.id },
    data: body.data,
  });
  return res.json(serializeCustomer(customer));
}
