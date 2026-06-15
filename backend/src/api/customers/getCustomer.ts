import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GetCustomerParams } from "../../models/customers.model.js";
import { serializeCustomer } from "./customers.router.js";

export async function getCustomer(req: Request, res: Response) {
  const params = GetCustomerParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const customer = await prisma.customer.findUnique({
    where: { id: params.data.id },
  });
  if (!customer) return res.status(404).json({ error: "Not found" });
  return res.json(serializeCustomer(customer));
}
