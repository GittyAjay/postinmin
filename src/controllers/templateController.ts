import { Request, Response } from "express";
import { z } from "zod";

import { createTemplate, deleteTemplate, listTemplates, recommendTemplate, updateTemplate } from "../services/templateService";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const ensureOwnership = async (businessId: string, ownerId: string) => {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.ownerId !== ownerId) {
    throw new AppError("Unauthorized", 403);
  }
};

const placeholderSchema = z.object({
  key: z.string(),
  type: z.enum(["text", "image", "shape"]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  maxWidth: z.number().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  imageUrl: z.string().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.enum(["normal", "bold"]), z.number()]).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  textDecoration: z.enum(["none", "underline", "line-through"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
  opacity: z.number().optional(),
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
  zIndex: z.number().optional(),
  shape: z.enum(["rectangle", "circle", "triangle", "line"]).optional(),
  fillColor: z.string().optional(),
  dashPattern: z.array(z.number()).optional(),
  sampleText: z.string().optional(),
});

const templateSchema = z.object({
  body: z.object({
    name: z.string(),
    backgroundUrl: z.string().optional(),
    backgroundColor: z.string().optional(),
    orientation: z.enum(["square", "wide", "story"]),
    tags: z.array(z.string()).default([]),
    emotionFit: z.array(z.string()).default([]),
    placeholders: z.array(placeholderSchema),
    canvasPreset: z.string().optional(),
    canvasWidth: z.number().optional(),
    canvasHeight: z.number().optional(),
  }),
});

export const createTemplateController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = templateSchema.parse({ body: req.body });
  await ensureOwnership(req.params.businessId, req.user!.id);
  const template = await createTemplate(req.params.businessId, {
    ...parsed.body,
    tags: parsed.body.tags ?? [],
    emotionFit: parsed.body.emotionFit ?? [],
  });
  res.status(201).json(template);
});

export const listTemplatesController = asyncHandler(async (req: Request, res: Response) => {
  await ensureOwnership(req.params.businessId, req.user!.id);
  const templates = await listTemplates(req.params.businessId);
  res.json(templates);
});

export const updateTemplateController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = templateSchema.shape.body.partial().parse(req.body);
  await ensureOwnership(req.params.businessId, req.user!.id);
  const template = await updateTemplate(req.params.templateId, req.params.businessId, parsed);
  res.json(template);
});

export const deleteTemplateController = asyncHandler(async (req: Request, res: Response) => {
  await ensureOwnership(req.params.businessId, req.user!.id);
  await deleteTemplate(req.params.templateId, req.params.businessId);
  res.status(204).send();
});

export const recommendTemplateController = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    body: z.object({
      emotion: z.string().optional(),
      style: z.string().optional(),
      platform: z.string().optional(),
      layoutType: z.enum(["square", "wide", "story"]).optional(),
    }),
  });
  const parsed = schema.parse({ body: req.body });
  await ensureOwnership(req.params.businessId, req.user!.id);
  const template = await recommendTemplate(req.params.businessId, parsed.body);
  res.json({ template });
});

