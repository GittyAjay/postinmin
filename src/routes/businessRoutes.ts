import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

import {
  createBusinessController,
  deleteBusinessController,
  getBusinessController,
  listBusinessesController,
  uploadBusinessLogoController,
  updateBusinessController,
} from "../controllers/businessController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join("uploads", "logos");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuid()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.use(authenticate);
router.post("/", createBusinessController);
router.get("/", listBusinessesController);
router.get("/:id", getBusinessController);
router.post("/:id/logo", upload.single("logo"), uploadBusinessLogoController);
router.put("/:id", updateBusinessController);
router.delete("/:id", deleteBusinessController);

export default router;

