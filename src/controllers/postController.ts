import { Request, Response } from "express";
import { z } from "zod";

import { listScheduledPosts } from "../services/calendarService";
import { publishPostToInstagram } from "../services/instagramPublishService";
import { asyncHandler } from "../utils/asyncHandler";

const listSchema = z.object({
  businessId: z.string(),
});

export const listPostsController = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = listSchema.parse(req.query);
  const posts = await listScheduledPosts(businessId, req.user?.id);
  res.json(posts);
});

const publishSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const publishPostToInstagramController = asyncHandler(async (req: Request, res: Response) => {
  const {
    params: { id },
  } = publishSchema.parse({ params: req.params });

  const origin = `${req.protocol}://${req.get("host")}`;
  const result = await publishPostToInstagram({
    postId: id,
    ownerId: req.user!.id,
    origin,
  });

  res.json(result);
});

