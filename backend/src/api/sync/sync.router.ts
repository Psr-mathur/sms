import { Router } from "express";
import { pushSync } from "./pushSync.js";
import { pullSync } from "./pullSync.js";

export const syncRouter = Router();

syncRouter.post("/push", pushSync);
syncRouter.get("/pull", pullSync);
