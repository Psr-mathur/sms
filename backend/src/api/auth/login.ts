import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { LoginBody, UserResponse } from "../../models/auth.model";

const JWT_SECRET = process.env["JWT_SECRET"] || "dev_secret_key_123_please_change_in_prod";

export async function login(req: Request, res: Response) {
  const body = LoginBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const { username, password } = body.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env["NODE_ENV"] === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.json(UserResponse.parse(user));
  } catch (err) {
    return res.status(500).json({ error: "An internal server error occurred" });
  }
}
