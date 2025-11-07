import { Request, Response } from "express";
import { z } from "zod";

import {
  createBusiness,
  deleteBusiness,
  getBusinessById,
  listBusinesses,
  updateBusiness,
} from "../services/businessService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const businessSchema = z.object({
  body: z.object({
    name: z.string(),
    category: z.string().optional(),
    targetAudience: z.string().optional(),
    goals: z.string().optional(),
    voiceTone: z.string().optional(),
    brandColors: z.string().optional(),
    logoUrl: z.string().optional(),
    preferredEmotion: z.string().optional(),
    preferredStyle: z.string().optional(),
    voiceSampleText: z.string().optional(),
    preferredPlatforms: z.array(z.string()).optional(),
  }),
});

export const createBusinessController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = businessSchema.parse({ body: req.body });
  const business = await createBusiness(req.user!.id, parsed.body);
  res.status(201).json(business);
});

export const listBusinessesController = asyncHandler(async (req: Request, res: Response) => {
  const businesses = await listBusinesses(req.user!.id);
  res.json(businesses);
});

export const getBusinessController = asyncHandler(async (req: Request, res: Response) => {
  const business = await getBusinessById(req.params.id, req.user!.id);
  res.json(business);
});

export const updateBusinessController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = businessSchema.shape.body.partial().parse(req.body);
  const business = await updateBusiness(req.params.id, req.user!.id, parsed);
  res.json(business);
});

export const deleteBusinessController = asyncHandler(async (req: Request, res: Response) => {
  await deleteBusiness(req.params.id, req.user!.id);
  res.status(204).send();
});

export const uploadBusinessLogoController = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  const filePath = `/${file.path.replace(/\\/g, "/")}`;
  const business = await updateBusiness(req.params.id, req.user!.id, { logoUrl: filePath });

  res.status(201).json({ url: filePath, business });
});

