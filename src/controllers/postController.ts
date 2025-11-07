import { Request, Response } from "express";
import { z } from "zod";

import { listScheduledPosts } from "../services/calendarService";
import { asyncHandler } from "../utils/asyncHandler";

const listSchema = z.object({
  businessId: z.string(),
});

export const listPostsController = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = listSchema.parse(req.query);
  const posts = await listScheduledPosts(businessId, req.user?.id);
  res.json(posts);
});

