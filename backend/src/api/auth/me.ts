import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { UserResponse } from "../../models/auth.model.js";

const JWT_SECRET = process.env["JWT_SECRET"] || "dev_secret_key_123_please_change_in_prod";

export async function me(req: Request, res: Response) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    return res.json(UserResponse.parse(user));
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
