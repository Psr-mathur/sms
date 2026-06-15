import { Router } from "express";
import { getDashboard } from "./getDashboard";
import { getDaily } from "./getDaily";
import { getMonthly } from "./getMonthly";
import { getByCustomer } from "./getByCustomer";
import { getBySupplier } from "./getBySupplier";

export const reportsRouter = Router();

reportsRouter.get("/dashboard", getDashboard);
reportsRouter.get("/daily", getDaily);
reportsRouter.get("/monthly", getMonthly);
reportsRouter.get("/by-customer", getByCustomer);
reportsRouter.get("/by-supplier", getBySupplier);
// Reports router mapping for dashboard, daily, monthly, customer, and supplier reports.
