import { Request, Response } from "express";
import { HealthCheckResponse } from "../../models/health.model.js";

export async function getHealth(_req: Request, res: Response) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  return res.json(data);
}
