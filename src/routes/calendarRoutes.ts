import { Router } from "express";

import { applyTemplateToPostController, generateCalendarController } from "../controllers/calendarController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.post("/generate", generateCalendarController);
router.patch("/template/:postId", applyTemplateToPostController);

export default router;

