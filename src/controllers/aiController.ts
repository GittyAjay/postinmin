import { Request, Response } from "express";
import { z } from "zod";

import { generatePostPreview } from "../services/aiService";
import { asyncHandler } from "../utils/asyncHandler";

const previewSchema = z.object({
  body: z.object({
    businessId: z.string(),
    theme: z.string().default("generic"),
  }),
});

export const generatePreviewController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = previewSchema.parse({ body: req.body });
  const result = await generatePostPreview(parsed.body.businessId, parsed.body.theme, req.user!.id);
  res.json(result);
});

