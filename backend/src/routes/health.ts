import { Router } from "express";
import { HealthCheckResponse } from "../validation/api.js";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});
