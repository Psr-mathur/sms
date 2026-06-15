import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ListCustomersQueryParams } from "../../models/customers.model";
import { serializeCustomer } from "./customers.router";

export async function listCustomers(req: Request, res: Response) {
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
}
