import { Router } from "express";

import { listPostsController, publishPostToInstagramController } from "../controllers/postController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.get("/", listPostsController);
router.post("/:id/publish/instagram", publishPostToInstagramController);

export default router;

