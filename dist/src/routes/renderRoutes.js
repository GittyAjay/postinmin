"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const renderController_1 = require("../controllers/renderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.post("/", renderController_1.renderPostController);
exports.default = router;
//# sourceMappingURL=renderRoutes.js.map