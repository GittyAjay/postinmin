"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSummary = void 0;
const prisma_1 = require("../config/prisma");
const getAnalyticsSummary = async ({ businessId, emotion }) => {
    const where = {
        post: {
            businessId,
            ...(emotion ? { emotion } : {}),
        },
    };
    const [totals, perEmotion] = await Promise.all([
        prisma_1.prisma.postAnalytics.aggregate({
            where,
            _sum: {
                impressions: true,
                likes: true,
                downloads: true,
                edits: true,
            },
            _count: true,
        }),
        prisma_1.prisma.postAnalytics.groupBy({
            by: ["postId"],
            where,
            _sum: {
                impressions: true,
                likes: true,
            },
        }),
    ]);
    return {
        totals,
        perPost: perEmotion,
    };
};
exports.getAnalyticsSummary = getAnalyticsSummary;
//# sourceMappingURL=analyticsService.js.map