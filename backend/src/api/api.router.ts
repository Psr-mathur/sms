import { Router } from "express";
import { itemsRouter } from "./items/items.router";
import { suppliersRouter } from "./suppliers/suppliers.router";
import { customersRouter } from "./customers/customers.router";
import { purchasesRouter } from "./purchases/purchases.router";
import { salesRouter } from "./sales/sales.router";
import { reportsRouter } from "./reports/reports.router";
import { syncRouter } from "./sync/sync.router";
import { healthRouter } from "./health/health.router";
import { authRouter } from "./auth/auth.router";

const router = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/items", itemsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/customers", customersRouter);
router.use("/purchases", purchasesRouter);
router.use("/sales", salesRouter);
router.use("/reports", reportsRouter);
router.use("/sync", syncRouter);

export default router;
