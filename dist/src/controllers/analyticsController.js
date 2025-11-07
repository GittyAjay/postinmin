"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsSummaryController = void 0;
const zod_1 = require("zod");
const analyticsService_1 = require("../services/analyticsService");
const prisma_1 = require("../config/prisma");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const summarySchema = zod_1.z.object({
    query: zod_1.z.object({
        businessId: zod_1.z.string(),
        emotion: zod_1.z.string().optional(),
    }),
});
exports.analyticsSummaryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = summarySchema.parse({ query: req.query });
    const business = await prisma_1.prisma.business.findUnique({ where: { id: parsed.query.businessId } });
    if (!business || business.ownerId !== req.user.id) {
        throw new errors_1.AppError("Unauthorized", 403);
    }
    const summary = await (0, analyticsService_1.getAnalyticsSummary)(parsed.query);
    res.json(summary);
});
//# sourceMappingURL=analyticsController.js.map