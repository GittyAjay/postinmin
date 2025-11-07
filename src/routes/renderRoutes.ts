import { Router } from "express";

import { renderPostController } from "../controllers/renderController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.post("/", renderPostController);

export default router;

