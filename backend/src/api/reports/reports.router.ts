import { Router } from "express";
import { getDashboard } from "./getDashboard.js";
import { getDaily } from "./getDaily.js";
import { getMonthly } from "./getMonthly.js";
import { getByCustomer } from "./getByCustomer.js";
import { getBySupplier } from "./getBySupplier.js";

export const reportsRouter = Router();

reportsRouter.get("/dashboard", getDashboard);
reportsRouter.get("/daily", getDaily);
reportsRouter.get("/monthly", getMonthly);
reportsRouter.get("/by-customer", getByCustomer);
reportsRouter.get("/by-supplier", getBySupplier);
// Reports router mapping for dashboard, daily, monthly, customer, and supplier reports.
