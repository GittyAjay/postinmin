"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCalendar = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const deepseekService_1 = require("./deepseekService");
const templateService_1 = require("./templateService");
const defaultThemes = ["Awareness", "Education", "Promotion", "Community", "Testimonial", "Behind the Scenes", "Seasonal"];
const generateCalendar = async ({ businessId, startDate, days, variants = 1, ownerId }) => {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new errors_1.AppError("Business not found", 404);
    if (ownerId && business.ownerId !== ownerId)
        throw new errors_1.AppError("Unauthorized", 403);
    const calendar = await prisma_1.prisma.marketingCalendar.create({
        data: {
            businessId,
            startDate: new Date(startDate),
            endDate: (0, dayjs_1.default)(startDate).add(days, "day").toDate(),
        },
    });
    const results = [];
    for (let i = 0; i < days; i += 1) {
        const date = (0, dayjs_1.default)(startDate).add(i, "day");
        const theme = defaultThemes[i % defaultThemes.length];
        const variantsData = [];
        let primaryPost = null;
        let primaryContent;
        let primaryBackgroundPrompt;
        let primaryTemplateId = null;
        for (let variantIndex = 0; variantIndex < variants; variantIndex += 1) {
            const marketing = await (0, deepseekService_1.generateMarketingPost)(business, theme);
            const orientation = marketing.layout_type
                ? marketing.layout_type.toLowerCase()
                : undefined;
            const template = await (0, templateService_1.recommendTemplate)(businessId, {
                emotion: marketing.emotion,
                layoutType: orientation,
                style: business.preferredStyle ?? undefined,
            });
            if (!primaryPost) {
                primaryPost = await prisma_1.prisma.scheduledPost.create({
                    data: {
                        businessId,
                        calendarId: calendar.id,
                        date: date.toDate(),
                        theme,
                        title: marketing.title,
                        subtitle: marketing.subtitle,
                        caption: marketing.caption,
                        hashtags: marketing.hashtags,
                        emotion: marketing.emotion,
                        backgroundUrl: null,
                        layoutType: marketing.layout_type,
                        templateId: template?.id,
                        renderedImage: null,
                        status: "PENDING",
                    },
                });
                primaryContent = marketing;
                primaryBackgroundPrompt = marketing.background_prompt;
                primaryTemplateId = template?.id ?? null;
            }
            else {
                variantsData.push({
                    theme,
                    marketing: marketing,
                    backgroundPrompt: marketing.background_prompt,
                    templateId: template?.id ?? null,
                });
            }
        }
        if (primaryPost && primaryContent && primaryBackgroundPrompt) {
            const allVariants = [
                {
                    theme,
                    marketing: primaryContent,
                    backgroundPrompt: primaryBackgroundPrompt,
                    templateId: primaryTemplateId,
                },
                ...variantsData,
            ];
            const updated = await prisma_1.prisma.scheduledPost.update({
                where: { id: primaryPost.id },
                data: { variants: allVariants },
                include: { template: true },
            });
            results.push({
                post: updated,
                content: primaryContent,
                backgroundPrompt: primaryBackgroundPrompt,
                templateId: primaryTemplateId,
                variants: allVariants,
            });
        }
    }
    return { calendar, posts: results };
};
exports.generateCalendar = generateCalendar;
//# sourceMappingURL=calendarService.js.map