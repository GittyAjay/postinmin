import type { Business } from "@prisma/client";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { generateBrandVoiceEmbedding } from "./deepseekService";

type BusinessResponse = Omit<Business, "instagramAccessToken"> & {
  instagramConnected: boolean;
};

const sanitizeBusiness = (business: Business): BusinessResponse => {
  const { instagramAccessToken, ...rest } = business;
  return {
    ...rest,
    instagramConnected: Boolean(instagramAccessToken && business.instagramBusinessId),
  };
};

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
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
}

export interface InstagramCredentialInput {
  instagramBusinessId: string;
  instagramAccessToken: string;
  instagramTokenExpiresAt?: Date | null;
}

export const createBusiness = async (ownerId: string, data: BusinessInput): Promise<BusinessResponse> => {
  let brandVoiceVector: number[] | undefined;

  if (data.voiceSampleText) {
    brandVoiceVector = await generateBrandVoiceEmbedding(data.voiceSampleText);
  }

  const business = await prisma.business.create({
    data: {
      ...data,
      preferredPlatforms: data.preferredPlatforms ?? [],
      facebookUrl: data.facebookUrl ?? null,
      instagramUrl: data.instagramUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      ownerId,
      brandVoiceVector,
    },
  });

  return sanitizeBusiness(business);
};

export const listBusinesses = async (ownerId: string) => {
  const businesses = await prisma.business.findMany({ where: { ownerId } });
  return businesses.map((business) => sanitizeBusiness(business));
};

export const getBusinessById = async (id: string, ownerId: string) => {
  const business = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!business) {
    throw new AppError("Business not found", 404);
  }
  return sanitizeBusiness(business);
};

export const updateBusiness = async (id: string, ownerId: string, data: Partial<BusinessInput>) => {
  const existingRecord = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!existingRecord) {
    throw new AppError("Business not found", 404);
  }

  let brandVoiceVector = existingRecord.brandVoiceVector as number[] | undefined;
  if (data.voiceSampleText && data.voiceSampleText !== existingRecord.voiceSampleText) {
    brandVoiceVector = await generateBrandVoiceEmbedding(data.voiceSampleText);
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      ...data,
      preferredPlatforms: data.preferredPlatforms ?? existingRecord.preferredPlatforms,
      facebookUrl: typeof data.facebookUrl !== "undefined" ? data.facebookUrl : existingRecord.facebookUrl,
      instagramUrl: typeof data.instagramUrl !== "undefined" ? data.instagramUrl : existingRecord.instagramUrl,
      linkedinUrl: typeof data.linkedinUrl !== "undefined" ? data.linkedinUrl : existingRecord.linkedinUrl,
      brandVoiceVector,
    },
  });

  return sanitizeBusiness(updated);
};

export const deleteBusiness = async (id: string, ownerId: string) => {
  const business = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!business) {
    throw new AppError("Business not found", 404);
  }
  await prisma.business.delete({ where: { id } });
};

export const upsertInstagramCredentials = async (
  id: string,
  ownerId: string,
  { instagramBusinessId, instagramAccessToken, instagramTokenExpiresAt }: InstagramCredentialInput,
) => {
  if (!instagramBusinessId || !instagramAccessToken) {
    throw new AppError("Instagram business ID and access token are required", 400);
  }

  const existing = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!existing) {
    throw new AppError("Business not found", 404);
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      instagramBusinessId,
      instagramAccessToken,
      instagramTokenExpiresAt: instagramTokenExpiresAt ?? null,
    },
  });

  return sanitizeBusiness(updated);
};

export const clearInstagramCredentials = async (id: string, ownerId: string) => {
  const existing = await prisma.business.findFirst({ where: { id, ownerId } });
  if (!existing) {
    throw new AppError("Business not found", 404);
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      instagramBusinessId: null,
      instagramAccessToken: null,
      instagramTokenExpiresAt: null,
    },
  });

  return sanitizeBusiness(updated);
};

