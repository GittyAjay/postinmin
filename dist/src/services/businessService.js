"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBusiness = exports.updateBusiness = exports.getBusinessById = exports.listBusinesses = exports.createBusiness = void 0;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const deepseekService_1 = require("./deepseekService");
const createBusiness = async (ownerId, data) => {
    let brandVoiceVector;
    if (data.voiceSampleText) {
        brandVoiceVector = await (0, deepseekService_1.generateBrandVoiceEmbedding)(data.voiceSampleText);
    }
    return prisma_1.prisma.business.create({
        data: {
            ...data,
            preferredPlatforms: data.preferredPlatforms ?? [],
            ownerId,
            brandVoiceVector,
        },
    });
};
exports.createBusiness = createBusiness;
const listBusinesses = (ownerId) => {
    return prisma_1.prisma.business.findMany({ where: { ownerId } });
};
exports.listBusinesses = listBusinesses;
const getBusinessById = async (id, ownerId) => {
    const business = await prisma_1.prisma.business.findFirst({ where: { id, ownerId } });
    if (!business) {
        throw new errors_1.AppError("Business not found", 404);
    }
    return business;
};
exports.getBusinessById = getBusinessById;
const updateBusiness = async (id, ownerId, data) => {
    const existing = await (0, exports.getBusinessById)(id, ownerId);
    let brandVoiceVector = existing.brandVoiceVector;
    if (data.voiceSampleText && data.voiceSampleText !== existing.voiceSampleText) {
        brandVoiceVector = await (0, deepseekService_1.generateBrandVoiceEmbedding)(data.voiceSampleText);
    }
    return prisma_1.prisma.business.update({
        where: { id },
        data: {
            ...data,
            preferredPlatforms: data.preferredPlatforms ?? existing.preferredPlatforms,
            brandVoiceVector,
        },
    });
};
exports.updateBusiness = updateBusiness;
const deleteBusiness = async (id, ownerId) => {
    await (0, exports.getBusinessById)(id, ownerId);
    await prisma_1.prisma.business.delete({ where: { id } });
};
exports.deleteBusiness = deleteBusiness;
//# sourceMappingURL=businessService.js.map