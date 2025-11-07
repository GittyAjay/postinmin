"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePostPreview = void 0;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const deepseekService_1 = require("./deepseekService");
const imageGenService_1 = require("./imageGenService");
const templateService_1 = require("./templateService");
const renderService_1 = require("./renderService");
const generatePostPreview = async (businessId, theme, ownerId) => {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new errors_1.AppError("Business not found", 404);
    if (ownerId && business.ownerId !== ownerId)
        throw new errors_1.AppError("Unauthorized", 403);
    const marketing = await (0, deepseekService_1.generateMarketingPost)(business, theme);
    const backgroundUrl = await (0, imageGenService_1.generateBackgroundImage)(marketing.background_prompt);
    const template = await (0, templateService_1.recommendTemplate)(businessId, {
        emotion: marketing.emotion,
        style: business.preferredStyle ?? undefined,
        layoutType: marketing.layout_type,
    });
    const renderedImage = template
        ? await (0, renderService_1.renderPost)({
            id: template.id,
            name: template.name,
            backgroundUrl: template.backgroundUrl ?? undefined,
            orientation: template.orientation,
            tags: template.tags,
            emotionFit: template.emotionFit,
            placeholders: template.placeholders,
        }, backgroundUrl, {
            title: marketing.title,
            subtitle: marketing.subtitle,
            caption: marketing.caption,
            hashtags: marketing.hashtags,
            emotion: marketing.emotion,
        })
        : "";
    return { marketing, backgroundUrl, template, renderedImage };
};
exports.generatePostPreview = generatePostPreview;
//# sourceMappingURL=aiService.js.map