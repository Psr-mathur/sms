import { Router } from "express";
import { itemsRouter } from "./items/items.router.js";
import { suppliersRouter } from "./suppliers/suppliers.router.js";
import { customersRouter } from "./customers/customers.router.js";
import { purchasesRouter } from "./purchases/purchases.router.js";
import { salesRouter } from "./sales/sales.router.js";
import { reportsRouter } from "./reports/reports.router.js";
import { syncRouter } from "./sync/sync.router.js";
import { healthRouter } from "./health/health.router.js";
import { authRouter } from "./auth/auth.router.js";
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);

router.use(authenticate);

router.use("/items", itemsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/customers", customersRouter);
router.use("/purchases", purchasesRouter);
router.use("/sales", salesRouter);
router.use("/reports", reportsRouter);
router.use("/sync", syncRouter);

export default router;
