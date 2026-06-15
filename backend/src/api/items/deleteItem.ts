import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { DeleteItemParams } from "../../models/items.model.js";

export async function deleteItem(req: Request, res: Response) {
  const params = DeleteItemParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await prisma.item.delete({
    where: { id: params.data.id },
  });
  return res.status(204).send();
}
