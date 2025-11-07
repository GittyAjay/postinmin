import { Router } from "express";

import { listPostsController } from "../controllers/postController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.get("/", listPostsController);

export default router;

