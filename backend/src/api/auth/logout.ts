import { Request, Response } from "express";

export async function logout(req: Request, res: Response) {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env["NODE_ENV"] === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
  });
  return res.status(204).send();
}
