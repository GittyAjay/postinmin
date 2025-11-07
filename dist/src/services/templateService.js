"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendTemplate = exports.deleteTemplate = exports.updateTemplate = exports.listTemplates = exports.createTemplate = void 0;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const createTemplate = async (businessId, data) => {
    return prisma_1.prisma.template.create({
        data: {
            ...data,
            businessId,
            placeholders: data.placeholders,
        },
    });
};
exports.createTemplate = createTemplate;
const listTemplates = (businessId) => {
    return prisma_1.prisma.template.findMany({ where: { businessId } });
};
exports.listTemplates = listTemplates;
const updateTemplate = async (id, businessId, data) => {
    await ensureTemplateOwnership(id, businessId);
    const updateData = { ...data };
    if (data.placeholders) {
        updateData.placeholders = data.placeholders;
    }
    return prisma_1.prisma.template.update({ where: { id }, data: updateData });
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (id, businessId) => {
    await ensureTemplateOwnership(id, businessId);
    await prisma_1.prisma.template.delete({ where: { id } });
};
exports.deleteTemplate = deleteTemplate;
const recommendTemplate = async (businessId, preferences) => {
    const templates = await prisma_1.prisma.template.findMany({ where: { businessId } });
    const scored = templates
        .map((template) => {
        let score = 0;
        if (preferences.emotion && template.emotionFit.includes(preferences.emotion))
            score += 5;
        if (preferences.layoutType && template.orientation === preferences.layoutType)
            score += 3;
        if (preferences.platform && template.tags.includes(preferences.platform))
            score += 2;
        if (preferences.style && template.tags.includes(preferences.style))
            score += 1;
        return { template, score };
    })
        .sort((a, b) => b.score - a.score);
    return scored[0]?.template ?? null;
};
exports.recommendTemplate = recommendTemplate;
const ensureTemplateOwnership = async (id, businessId) => {
    const template = await prisma_1.prisma.template.findFirst({ where: { id, businessId } });
    if (!template) {
        throw new errors_1.AppError("Template not found", 404);
    }
};
//# sourceMappingURL=templateService.js.map