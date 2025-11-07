"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessController_1 = require("../controllers/businessController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.post("/", businessController_1.createBusinessController);
router.get("/", businessController_1.listBusinessesController);
router.get("/:id", businessController_1.getBusinessController);
router.put("/:id", businessController_1.updateBusinessController);
router.delete("/:id", businessController_1.deleteBusinessController);
exports.default = router;
//# sourceMappingURL=businessRoutes.js.map