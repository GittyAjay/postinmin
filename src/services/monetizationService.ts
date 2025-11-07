import type { PlanType } from "@prisma/client";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

const planLimits: Record<PlanType, Record<string, number | null>> = {
  FREE: { ai_requests: 10, image_generations: 10 },
  PRO: { ai_requests: 100, image_generations: 100 },
  ENTERPRISE: { ai_requests: null, image_generations: null },
};

export const checkQuota = async (userId: string, quotaKey: string) => {
  const plan = await prisma.userPlan.findFirst({ where: { userId } });
  if (!plan) throw new AppError("User plan not found", 400);

  const limits = planLimits[plan.planType];
  const limit = limits[quotaKey];

  if (limit === null) return { plan, limit: null, usage: 0 };

  const usage = (plan.quota as Record<string, number> | null)?.[quotaKey] ?? 0;
  if (usage >= limit) {
    throw new AppError("Quota exceeded", 402);
  }
  return { plan, limit, usage };
};

export const incrementQuota = async (userId: string, quotaKey: string) => {
  const plan = await prisma.userPlan.findFirst({ where: { userId } });
  if (!plan) throw new AppError("User plan not found", 400);

  const usage = (plan.quota as Record<string, number> | null) ?? {};
  const updated = {
    ...usage,
    [quotaKey]: (usage[quotaKey] ?? 0) + 1,
  };

  await prisma.userPlan.update({ where: { id: plan.id }, data: { quota: updated } });
};

