import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ListItemsQueryParams } from "../../models/items.model.js";
import { serializeItem, computeStatus } from "./items.router.js";

export async function listItems(req: Request, res: Response) {
  const query = ListItemsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });

  const { search, status } = query.data;
  const conditions: any = {};
  if (search) {
    conditions.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  const items = await prisma.item.findMany({
    where: conditions,
  });

  const serialized = items.map(serializeItem);

  if (status) {
    return res.json(serialized.filter(i => i.status === status));
  }

  return res.json(serialized);
}
