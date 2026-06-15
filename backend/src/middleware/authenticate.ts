import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] || "dev_secret_key_123_please_change_in_prod";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No session token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session token" });
  }
}
