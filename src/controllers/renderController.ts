import { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { renderPost } from "../services/renderService";

const renderSchema = z.object({
  body: z.object({
    postId: z.string(),
  }),
});

export const renderPostController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = renderSchema.parse({ body: req.body });
  const post = await prisma.scheduledPost.findFirst({
    where: { id: parsed.body.postId },
    include: { template: true, business: { select: { ownerId: true } } },
  });

  if (!post || post.business.ownerId !== req.user!.id) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!post.template) {
    return res.status(400).json({ message: "Post does not have an associated template" });
  }

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

  const updated = await prisma.scheduledPost.update({
    where: { id: post.id },
    data: { renderedImage },
  });

  return res.json(updated);
});

