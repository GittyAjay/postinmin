"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRenderWorker = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const renderService_1 = require("../services/renderService");
const logger_1 = require("../utils/logger");
const registerRenderWorker = () => {
    if (!env_1.env.REDIS_URL) {
        return null;
    }
    const worker = new bullmq_1.Worker("render", async (job) => {
        const { postId } = job.data;
        const post = await prisma_1.prisma.scheduledPost.findUnique({ include: { template: true }, where: { id: postId } });
        if (!post?.template)
            return;
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
        await prisma_1.prisma.scheduledPost.update({ where: { id: postId }, data: { renderedImage } });
    }, { connection: { url: env_1.env.REDIS_URL } });
    worker.on("failed", (job, err) => {
        logger_1.logger.error("render job failed", { jobId: job?.id, error: err });
    });
    worker.on("error", (error) => {
        logger_1.logger.error("render worker encountered an error", { error });
    });
    return worker;
};
exports.registerRenderWorker = registerRenderWorker;
//# sourceMappingURL=renderWorker.js.map