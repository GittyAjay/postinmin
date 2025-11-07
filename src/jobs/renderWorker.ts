import { Worker } from "bullmq";

import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { renderPost } from "../services/renderService";
import { logger } from "../utils/logger";

export const registerRenderWorker = () => {
  if (!env.REDIS_URL) {
    return null;
  }

  const worker = new Worker(
    "render",
    async (job) => {
      const { postId } = job.data as { postId: string };
      const post = await prisma.scheduledPost.findUnique({ include: { template: true }, where: { id: postId } });
      if (!post?.template) return;

      const renderedImage = await renderPost(
        {
          id: post.template.id,
          name: post.template.name,
          backgroundUrl: post.template.backgroundUrl ?? undefined,
          orientation: post.template.orientation,
          tags: post.template.tags,
          emotionFit: post.template.emotionFit,
          placeholders: post.template.placeholders as any,
        },
        post.backgroundUrl ?? "",
        {
          title: post.title ?? "",
          subtitle: post.subtitle ?? undefined,
          caption: post.caption ?? undefined,
          hashtags: post.hashtags ?? undefined,
          emotion: post.emotion ?? undefined,
        }
      );

      await prisma.scheduledPost.update({ where: { id: postId }, data: { renderedImage } });
    },
    { connection: { url: env.REDIS_URL } }
  );

  worker.on("failed", (job, err) => {
    logger.error("render job failed", { jobId: job?.id, error: err });
  });

  worker.on("error", (error) => {
    logger.error("render worker encountered an error", { error });
  });

  return worker;
};

