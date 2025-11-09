"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const businessController_1 = require("../controllers/businessController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadPath = path_1.default.join("uploads", "logos");
        fs_1.default.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.use(authMiddleware_1.authenticate);
router.post("/", businessController_1.createBusinessController);
router.get("/", businessController_1.listBusinessesController);
router.get("/:id", businessController_1.getBusinessController);
router.post("/:id/logo", upload.single("logo"), businessController_1.uploadBusinessLogoController);
router.put("/:id", businessController_1.updateBusinessController);
router.delete("/:id", businessController_1.deleteBusinessController);
exports.default = router;
//# sourceMappingURL=businessRoutes.js.map