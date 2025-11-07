import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

import {
  createTemplateController,
  deleteTemplateController,
  listTemplatesController,
  recommendTemplateController,
  updateTemplateController,
} from "../controllers/templateController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join("uploads", "templates")),
  filename: (_req, file, cb) => {
    cb(null, `${uuid()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.use(authenticate);

router.post("/:businessId/upload", upload.single("background"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });
  const filePath = `/${file.path.replace(/\\/g, "/")}`;
  return res.status(201).json({ url: filePath });
});

router.post("/:businessId", createTemplateController);
router.get("/:businessId", listTemplatesController);
router.put("/:businessId/:templateId", updateTemplateController);
router.delete("/:businessId/:templateId", deleteTemplateController);
router.post("/:businessId/recommend", recommendTemplateController);

export default router;

