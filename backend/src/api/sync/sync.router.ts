import { Router } from "express";
import { pushSync } from "./pushSync";
import { pullSync } from "./pullSync";

export const syncRouter = Router();

syncRouter.post("/push", pushSync);
syncRouter.get("/pull", pullSync);
