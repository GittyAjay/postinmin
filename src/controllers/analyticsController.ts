import { Request, Response } from "express";
import { z } from "zod";

import { getAnalyticsSummary } from "../services/analyticsService";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const summarySchema = z.object({
  query: z.object({
    businessId: z.string(),
    emotion: z.string().optional(),
  }),
});

export const analyticsSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = summarySchema.parse({ query: req.query });
  const business = await prisma.business.findUnique({ where: { id: parsed.query.businessId } });
  if (!business || business.ownerId !== req.user!.id) {
    throw new AppError("Unauthorized", 403);
  }
  const summary = await getAnalyticsSummary(parsed.query);
  res.json(summary);
});

