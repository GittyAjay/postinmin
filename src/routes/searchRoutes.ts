import { Router } from "express";

import { searchController } from "../controllers/searchController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);
router.get("/", searchController);

export default router;

