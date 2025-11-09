import { Request, Response } from "express";
import { z } from "zod";

import {
  clearInstagramCredentials,
  createBusiness,
  deleteBusiness,
  getBusinessById,
  listBusinesses,
  updateBusiness,
  upsertInstagramCredentials,
} from "../services/businessService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  },
  z.union([z.string().url(), z.null()]),
);

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
    facebookUrl: optionalUrl.optional(),
    instagramUrl: optionalUrl.optional(),
    linkedinUrl: optionalUrl.optional(),
  }),
});

const instagramCredentialSchema = z.object({
  body: z.object({
    instagramBusinessId: z.string().min(1, "Instagram business ID is required"),
    instagramAccessToken: z.string().min(10, "Instagram access token looks too short"),
    tokenExpiresAt: z
      .preprocess((value) => {
        if (!value) return undefined;
        if (typeof value !== "string") return undefined;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
      }, z.date().optional())
      .optional(),
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

export const connectInstagramController = asyncHandler(async (req: Request, res: Response) => {
  const { body } = instagramCredentialSchema.parse({ body: req.body });
  const business = await upsertInstagramCredentials(req.params.id, req.user!.id, {
    instagramBusinessId: body.instagramBusinessId.trim(),
    instagramAccessToken: body.instagramAccessToken.trim(),
    instagramTokenExpiresAt: body.tokenExpiresAt ?? null,
  });
  res.json(business);
});

export const disconnectInstagramController = asyncHandler(async (req: Request, res: Response) => {
  const business = await clearInstagramCredentials(req.params.id, req.user!.id);
  res.json(business);
});

