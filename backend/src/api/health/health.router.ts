import { Router } from "express";
import { getHealth } from "./getHealth";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealth);
