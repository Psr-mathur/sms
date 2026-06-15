import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { GetItemParams } from "../../models/items.model";
import { serializeItem } from "./items.router";

export async function getItem(req: Request, res: Response) {
  const params = GetItemParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const item = await prisma.item.findUnique({
    where: { id: params.data.id },
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  return res.json(serializeItem(item));
}
