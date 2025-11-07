import { Router } from "express";

import { analyticsSummaryController } from "../controllers/analyticsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.get("/summary", analyticsSummaryController);

export default router;

