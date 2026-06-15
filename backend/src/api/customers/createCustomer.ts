import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { CreateCustomerBody } from "../../models/customers.model";
import { serializeCustomer } from "./customers.router";

export async function createCustomer(req: Request, res: Response) {
  const body = CreateCustomerBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const customer = await prisma.customer.create({
    data: body.data as any,
  });
  return res.status(201).json(serializeCustomer(customer));
}
