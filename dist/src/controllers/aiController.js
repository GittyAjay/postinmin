"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePreviewController = void 0;
const zod_1 = require("zod");
const aiService_1 = require("../services/aiService");
const asyncHandler_1 = require("../utils/asyncHandler");
const previewSchema = zod_1.z.object({
    body: zod_1.z.object({
        businessId: zod_1.z.string(),
        theme: zod_1.z.string().default("generic"),
    }),
});
exports.generatePreviewController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = previewSchema.parse({ body: req.body });
    const result = await (0, aiService_1.generatePostPreview)(parsed.body.businessId, parsed.body.theme, req.user.id);
    res.json(result);
});
//# sourceMappingURL=aiController.js.map