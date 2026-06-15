import { Router } from "express";
import { getHealth } from "./getHealth.js";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealth);
