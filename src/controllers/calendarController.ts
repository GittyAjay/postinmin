import { Request, Response } from "express";
import { z } from "zod";

import { applyTemplateToPost, generateCalendar } from "../services/calendarService";
import { asyncHandler } from "../utils/asyncHandler";

const generateSchema = z.object({
  body: z.object({
    businessId: z.string(),
    startDate: z.string(),
    days: z.number().min(1).max(60),
    variants: z.number().min(1).max(5).optional(),
  }),
});

export const generateCalendarController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = generateSchema.parse({ body: req.body });
  const result = await generateCalendar({ ...parsed.body, ownerId: req.user!.id });
  res.status(201).json(result);
});

const applyTemplateSchema = z.object({
  params: z.object({
    postId: z.string(),
  }),
  body: z.object({
    templateId: z.string().nullable().optional(),
  }),
});

export const applyTemplateToPostController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = applyTemplateSchema.parse({ params: req.params, body: req.body });
  const updated = await applyTemplateToPost({
    postId: parsed.params.postId,
    templateId: parsed.body.templateId ?? null,
    ownerId: req.user?.id,
  });
  res.json(updated);
});

