import { Router } from "express";
import { itemsRouter } from "./items.js";
import { suppliersRouter } from "./suppliers.js";
import { customersRouter } from "./customers.js";
import { purchasesRouter } from "./purchases.js";
import { salesRouter } from "./sales.js";
import { reportsRouter } from "./reports.js";
import { syncRouter } from "./sync.js";
import { healthRouter } from "./health.js";

const router = Router();

router.use("/", healthRouter);
router.use("/items", itemsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/customers", customersRouter);
router.use("/purchases", purchasesRouter);
router.use("/sales", salesRouter);
router.use("/reports", reportsRouter);
router.use("/sync", syncRouter);

export default router;
