"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const templateController_1 = require("../controllers/templateController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)({ mergeParams: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, path_1.default.join("uploads", "templates")),
    filename: (_req, file, cb) => {
        cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.use(authMiddleware_1.authenticate);
router.post("/:businessId/upload", upload.single("background"), (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ message: "No file uploaded" });
    const filePath = `/${file.path.replace(/\\/g, "/")}`;
    return res.status(201).json({ url: filePath });
});
router.post("/:businessId", templateController_1.createTemplateController);
router.get("/:businessId", templateController_1.listTemplatesController);
router.put("/:businessId/:templateId", templateController_1.updateTemplateController);
router.delete("/:businessId/:templateId", templateController_1.deleteTemplateController);
router.post("/:businessId/recommend", templateController_1.recommendTemplateController);
exports.default = router;
//# sourceMappingURL=templateRoutes.js.map