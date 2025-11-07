import { Request, Response } from "express";
import { z } from "zod";

import { generateCalendar } from "../services/calendarService";
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

