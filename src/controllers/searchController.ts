import { Request, Response } from "express";
import { z } from "zod";

import { searchPosts } from "../services/searchService";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const searchSchema = z.object({
  query: z.object({
    businessId: z.string(),
    q: z.string().min(1),
  }),
});

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchSchema.parse({ query: req.query });
  const business = await prisma.business.findUnique({ where: { id: parsed.query.businessId } });
  if (!business || business.ownerId !== req.user!.id) {
    throw new AppError("Unauthorized", 403);
  }
  const results = await searchPosts(parsed.query.businessId, parsed.query.q);
  res.json(results);
});

