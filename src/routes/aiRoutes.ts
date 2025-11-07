import { Router } from "express";

import { generatePreviewController } from "../controllers/aiController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.post("/preview", generatePreviewController);

export default router;

