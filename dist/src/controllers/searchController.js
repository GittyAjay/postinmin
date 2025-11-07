"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = void 0;
const zod_1 = require("zod");
const searchService_1 = require("../services/searchService");
const prisma_1 = require("../config/prisma");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const searchSchema = zod_1.z.object({
    query: zod_1.z.object({
        businessId: zod_1.z.string(),
        q: zod_1.z.string().min(1),
    }),
});
exports.searchController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = searchSchema.parse({ query: req.query });
    const business = await prisma_1.prisma.business.findUnique({ where: { id: parsed.query.businessId } });
    if (!business || business.ownerId !== req.user.id) {
        throw new errors_1.AppError("Unauthorized", 403);
    }
    const results = await (0, searchService_1.searchPosts)(parsed.query.businessId, parsed.query.q);
    res.json(results);
});
//# sourceMappingURL=searchController.js.map