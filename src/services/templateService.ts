import { Prisma } from "@prisma/client";
import type { TemplateOrientation } from "@prisma/client";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { TemplateLayout } from "../types/template";

export interface TemplateInput {
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  orientation: TemplateOrientation;
  tags: string[];
  emotionFit: string[];
  placeholders: TemplateLayout["placeholders"];
  canvasPreset?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export const createTemplate = async (businessId: string, data: TemplateInput) => {
  return prisma.template.create({
    data: {
      ...data,
      businessId,
      placeholders: data.placeholders as unknown as Prisma.InputJsonValue,
    },
  });
};

export const listTemplates = (businessId: string) => {
  return prisma.template.findMany({ where: { businessId } });
};

export const updateTemplate = async (id: string, businessId: string, data: Partial<TemplateInput>) => {
  await ensureTemplateOwnership(id, businessId);
  const updateData = { ...data } as Prisma.TemplateUpdateInput;
  if (data.placeholders) {
    updateData.placeholders = data.placeholders as unknown as Prisma.InputJsonValue;
  }
  return prisma.template.update({ where: { id }, data: updateData });
};

export const deleteTemplate = async (id: string, businessId: string) => {
  await ensureTemplateOwnership(id, businessId);
  await prisma.template.delete({ where: { id } });
};

export const recommendTemplate = async (
  businessId: string,
  preferences: { emotion?: string; style?: string; platform?: string; layoutType?: TemplateOrientation }
) => {
  const templates = await prisma.template.findMany({ where: { businessId } });

  const scored = templates
    .map((template) => {
      let score = 0;
      if (preferences.emotion && template.emotionFit.includes(preferences.emotion)) score += 5;
      if (preferences.layoutType && template.orientation === preferences.layoutType) score += 3;
      if (preferences.platform && template.tags.includes(preferences.platform)) score += 2;
      if (preferences.style && template.tags.includes(preferences.style)) score += 1;
      return { template, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.template ?? null;
};

const ensureTemplateOwnership = async (id: string, businessId: string) => {
  const template = await prisma.template.findFirst({ where: { id, businessId } });
  if (!template) {
    throw new AppError("Template not found", 404);
  }
};

