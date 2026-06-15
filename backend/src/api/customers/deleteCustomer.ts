import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { DeleteCustomerParams } from "../../models/customers.model";

export async function deleteCustomer(req: Request, res: Response) {
  const params = DeleteCustomerParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.customer.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
}
