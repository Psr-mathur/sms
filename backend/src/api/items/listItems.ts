import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ListItemsQueryParams } from "../../models/items.model.js";
import { serializeItem } from "./items.router.js";

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
  if (status) {
    conditions.status = status;
  }

  const items = await prisma.item.findMany({
    where: conditions,
  });
  return res.json(items.map(serializeItem));
}
