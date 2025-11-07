"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPostController = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const asyncHandler_1 = require("../utils/asyncHandler");
const renderService_1 = require("../services/renderService");
const renderSchema = zod_1.z.object({
    body: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
});
exports.renderPostController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = renderSchema.parse({ body: req.body });
    const post = await prisma_1.prisma.scheduledPost.findFirst({
        where: { id: parsed.body.postId },
        include: { template: true, business: { select: { ownerId: true } } },
    });
    if (!post || post.business.ownerId !== req.user.id) {
        return res.status(404).json({ message: "Post not found" });
    }
    if (!post.template) {
        return res.status(400).json({ message: "Post does not have an associated template" });
    }
    const renderedImage = await (0, renderService_1.renderPost)({
        id: post.template.id,
        name: post.template.name,
        backgroundUrl: post.template.backgroundUrl ?? undefined,
        orientation: post.template.orientation,
        tags: post.template.tags,
        emotionFit: post.template.emotionFit,
        placeholders: post.template.placeholders,
    }, post.backgroundUrl ?? "", {
        title: post.title ?? "",
        subtitle: post.subtitle ?? undefined,
        caption: post.caption ?? undefined,
        hashtags: post.hashtags ?? undefined,
        emotion: post.emotion ?? undefined,
    });
    const updated = await prisma_1.prisma.scheduledPost.update({
        where: { id: post.id },
        data: { renderedImage },
    });
    return res.json(updated);
});
//# sourceMappingURL=renderController.js.map