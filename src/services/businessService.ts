import type { Business } from "@prisma/client";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { generateBrandVoiceEmbedding } from "./deepseekService";

export interface BusinessInput {
  name: string;
  category?: string;
  targetAudience?: string;
  goals?: string;
  voiceTone?: string;
  brandColors?: string;
  logoUrl?: string;
  preferredEmotion?: string;
  preferredStyle?: string;
  voiceSampleText?: string;
  preferredPlatforms?: string[];
}

export const createBusiness = async (ownerId: string, data: BusinessInput): Promise<Business> => {
  let brandVoiceVector: number[] | undefined;

  if (data.voiceSampleText) {
    brandVoiceVector = await generateBrandVoiceEmbedding(data.voiceSampleText);
  }

  return prisma.business.create({
    data: {
      ...data,
      preferredPlatforms: data.preferredPlatforms ?? [],
      ownerId,
      brandVoiceVector,
    },
  });
};

export const listBusinesses = (ownerId: string) => {
  return prisma.business.findMany({ where: { ownerId } });
};

export const getBusinessById = async (id: string, ownerId: string) => {
  const business = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!business) {
    throw new AppError("Business not found", 404);
  }
  return business;
};

export const updateBusiness = async (id: string, ownerId: string, data: Partial<BusinessInput>) => {
  const existing = await getBusinessById(id, ownerId);

  let brandVoiceVector = existing.brandVoiceVector as number[] | undefined;
  if (data.voiceSampleText && data.voiceSampleText !== existing.voiceSampleText) {
    brandVoiceVector = await generateBrandVoiceEmbedding(data.voiceSampleText);
  }

  return prisma.business.update({
    where: { id },
    data: {
      ...data,
      preferredPlatforms: data.preferredPlatforms ?? existing.preferredPlatforms,
      brandVoiceVector,
    },
  });
};

export const deleteBusiness = async (id: string, ownerId: string) => {
  await getBusinessById(id, ownerId);
  await prisma.business.delete({ where: { id } });
};

