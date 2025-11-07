"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementQuota = exports.checkQuota = void 0;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const planLimits = {
    FREE: { ai_requests: 10, image_generations: 10 },
    PRO: { ai_requests: 100, image_generations: 100 },
    ENTERPRISE: { ai_requests: null, image_generations: null },
};
const checkQuota = async (userId, quotaKey) => {
    const plan = await prisma_1.prisma.userPlan.findFirst({ where: { userId } });
    if (!plan)
        throw new errors_1.AppError("User plan not found", 400);
    const limits = planLimits[plan.planType];
    const limit = limits[quotaKey];
    if (limit === null)
        return { plan, limit: null, usage: 0 };
    const usage = plan.quota?.[quotaKey] ?? 0;
    if (usage >= limit) {
        throw new errors_1.AppError("Quota exceeded", 402);
    }
    return { plan, limit, usage };
};
exports.checkQuota = checkQuota;
const incrementQuota = async (userId, quotaKey) => {
    const plan = await prisma_1.prisma.userPlan.findFirst({ where: { userId } });
    if (!plan)
        throw new errors_1.AppError("User plan not found", 400);
    const usage = plan.quota ?? {};
    const updated = {
        ...usage,
        [quotaKey]: (usage[quotaKey] ?? 0) + 1,
    };
    await prisma_1.prisma.userPlan.update({ where: { id: plan.id }, data: { quota: updated } });
};
exports.incrementQuota = incrementQuota;
//# sourceMappingURL=monetizationService.js.map