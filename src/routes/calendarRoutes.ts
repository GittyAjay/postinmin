import { Router } from "express";

import { generateCalendarController } from "../controllers/calendarController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.post("/generate", generateCalendarController);

export default router;

