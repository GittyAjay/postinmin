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
  type: z.enum(["text", "image"]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
});

const templateSchema = z.object({
  body: z.object({
    name: z.string(),
    backgroundUrl: z.string().optional(),
    orientation: z.enum(["square", "wide", "story"]),
    tags: z.array(z.string()).default([]),
    emotionFit: z.array(z.string()).default([]),
    placeholders: z.array(placeholderSchema),
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

