import { prisma } from "../config/prisma";

export interface AnalyticsSummaryParams {
  businessId: string;
  emotion?: string;
}

export const getAnalyticsSummary = async ({ businessId, emotion }: AnalyticsSummaryParams) => {
  const where = {
    post: {
      businessId,
      ...(emotion ? { emotion } : {}),
    },
  } as const;

  const [totals, perEmotion] = await Promise.all([
    prisma.postAnalytics.aggregate({
      where,
      _sum: {
        impressions: true,
        likes: true,
        downloads: true,
        edits: true,
      },
      _count: true,
    }),
    prisma.postAnalytics.groupBy({
      by: ["postId"],
      where,
      _sum: {
        impressions: true,
        likes: true,
      },
    }),
  ]);

  return {
    totals,
    perPost: perEmotion,
  };
};

