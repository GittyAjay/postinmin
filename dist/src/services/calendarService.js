"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScheduledPosts = exports.applyTemplateToPost = exports.generateCalendar = void 0;
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const deepseekService_1 = require("./deepseekService");
const templateService_1 = require("./templateService");
const creativeFrameworks = [
    {
        theme: "Awareness",
        creativeAngle: "spotlight how the platform removes manual GST headaches with a celebratory reveal",
        emotion: "joy",
        formatHint: "square carousel contrasting pain vs. relief",
        ctaFocus: "Book a live walkthrough",
        narrativeHook: "Open with a question about the time your audience loses to manual filings.",
    },
    {
        theme: "Education",
        creativeAngle: "share a regulation update or GST tip in plain language with tactical guidance",
        emotion: "trust",
        formatHint: "square infographic with 3 quick tips",
        ctaFocus: "Download the compliance checklist",
        narrativeHook: "Lead with an insight accountants can pass to clients today.",
    },
    {
        theme: "Testimonial",
        creativeAngle: "feature a customer win with quantified time savings and peace of mind",
        emotion: "anticipation",
        formatHint: "story-style vertical success snapshot",
        ctaFocus: "Start the free trial",
        narrativeHook: "Hook the reader with the size of the results your customer achieved.",
    },
    {
        theme: "Community",
        creativeAngle: "invite pros to a webinar or peer roundtable with behind-the-scenes access",
        emotion: "joy",
        formatHint: "wide banner promoting an upcoming event",
        ctaFocus: "Register for the session",
        narrativeHook: "Highlight the collaborative energy accountants will experience.",
    },
    {
        theme: "Behind the Scenes",
        creativeAngle: "reveal the AI workflow or team diligence that guarantees accuracy",
        emotion: "calm",
        formatHint: "square product UI close-up with annotation callouts",
        ctaFocus: "Take the product tour",
        narrativeHook: "Start by reducing fear about compliance slips with your safeguards.",
    },
    {
        theme: "Promotion",
        creativeAngle: "announce a limited-time onboarding boost or premium feature unlock",
        emotion: "anticipation",
        formatHint: "square headline card with countdown motif",
        ctaFocus: "Claim the limited offer",
        narrativeHook: "Lead with urgency tied to an expiring bonus.",
    },
    {
        theme: "Thought Leadership",
        creativeAngle: "share an insight on the future of GST automation and advisory services",
        emotion: "trust",
        formatHint: "wide LinkedIn-style insight card",
        ctaFocus: "Read the full insight",
        narrativeHook: "Pose a provocative claim about tomorrow's compliance expectations.",
    },
    {
        theme: "Product Feature",
        creativeAngle: "spotlight the reconciliation dashboard with a metric proving ROI",
        emotion: "joy",
        formatHint: "square split layout showing metric and UI preview",
        ctaFocus: "See the dashboard in action",
        narrativeHook: "Kick off with the tangible number RapidGST impacts most.",
    },
];
const generateCalendar = async ({ businessId, startDate, days, variants = 1, ownerId }) => {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new errors_1.AppError("Business not found", 404);
    if (ownerId && business.ownerId !== ownerId)
        throw new errors_1.AppError("Unauthorized", 403);
    const calendarStart = new Date(startDate);
    const calendarEnd = (0, dayjs_1.default)(startDate).add(days, "day").toDate();
    await prisma_1.prisma.scheduledPost.deleteMany({
        where: {
            businessId,
            date: {
                gte: calendarStart,
                lt: calendarEnd,
            },
        },
    });
    const calendar = await prisma_1.prisma.marketingCalendar.create({
        data: {
            businessId,
            startDate: calendarStart,
            endDate: calendarEnd,
        },
    });
    const results = [];
    for (let i = 0; i < days; i += 1) {
        const date = (0, dayjs_1.default)(startDate).add(i, "day");
        const framework = creativeFrameworks[i % creativeFrameworks.length];
        const variantsData = [];
        let primaryPost = null;
        let primaryContent;
        let primaryBackgroundPrompt;
        let primaryTemplateId = null;
        for (let variantIndex = 0; variantIndex < variants; variantIndex += 1) {
            const marketing = await (0, deepseekService_1.generateMarketingPost)(business, {
                ...framework,
                emotion: framework.emotion ?? business.preferredEmotion ?? "joy",
                dayOfWeek: date.format("dddd"),
            });
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
                        theme: framework.theme,
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
                    theme: framework.theme,
                    marketing: marketing,
                    backgroundPrompt: marketing.background_prompt,
                    templateId: template?.id ?? null,
                });
            }
        }
        if (primaryPost && primaryContent && primaryBackgroundPrompt) {
            const allVariants = [
                {
                    theme: framework.theme,
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
const normaliseVariants = (variants) => Array.isArray(variants) ? variants : [];
const applyTemplateToPost = async ({ postId, templateId, ownerId }) => {
    const post = await prisma_1.prisma.scheduledPost.findUnique({
        where: { id: postId },
        include: { business: { select: { ownerId: true } } },
    });
    if (!post) {
        throw new errors_1.AppError("Scheduled post not found", 404);
    }
    if (ownerId && post.business.ownerId !== ownerId) {
        throw new errors_1.AppError("Unauthorized", 403);
    }
    let desiredTemplateId = templateId ?? null;
    if (desiredTemplateId) {
        const template = await prisma_1.prisma.template.findUnique({ where: { id: desiredTemplateId } });
        if (!template || template.businessId !== post.businessId) {
            throw new errors_1.AppError("Template not found for this business", 404);
        }
    }
    const variants = normaliseVariants(post.variants).map((variant, index) => {
        if (index === 0 && typeof variant === "object" && variant !== null && !Array.isArray(variant)) {
            return {
                ...variant,
                templateId: desiredTemplateId,
            };
        }
        return variant;
    });
    const variantsPayload = variants.length
        ? variants
        : post.variants === null
            ? client_1.Prisma.JsonNull
            : post.variants;
    const updated = await prisma_1.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
            templateId: desiredTemplateId,
            variants: variantsPayload,
        },
    });
    return {
        ...updated,
        variants: normaliseVariants(updated.variants),
    };
};
exports.applyTemplateToPost = applyTemplateToPost;
const listScheduledPosts = async (businessId, ownerId) => {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
    if (!business)
        throw new errors_1.AppError("Business not found", 404);
    if (ownerId && business.ownerId !== ownerId)
        throw new errors_1.AppError("Unauthorized", 403);
    const posts = await prisma_1.prisma.scheduledPost.findMany({
        where: { businessId },
        orderBy: { date: "asc" },
        include: { template: true },
    });
    return posts.map((post) => ({
        ...post,
        variants: normaliseVariants(post.variants),
    }));
};
exports.listScheduledPosts = listScheduledPosts;
//# sourceMappingURL=calendarService.js.map