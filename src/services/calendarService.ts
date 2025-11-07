import { Prisma } from "@prisma/client";
import type { TemplateOrientation } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { generateMarketingPost, type MarketingContentPayload } from "./deepseekService";
import { recommendTemplate } from "./templateService";

const defaultThemes = ["Awareness", "Education", "Promotion", "Community", "Testimonial", "Behind the Scenes", "Seasonal"];

export interface GenerateCalendarInput {
  businessId: string;
  startDate: string;
  days: number;
  variants?: number;
  ownerId?: string;
}

type ScheduledPostWithTemplate = Prisma.ScheduledPostGetPayload<{ include: { template: true } }>;

interface GeneratedPostResult {
  post: ScheduledPostWithTemplate;
  content: MarketingContentPayload;
  backgroundPrompt: string;
  templateId: string | null;
  variants: Prisma.JsonArray;
}

export const generateCalendar = async ({ businessId, startDate, days, variants = 1, ownerId }: GenerateCalendarInput) => {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError("Business not found", 404);
  if (ownerId && business.ownerId !== ownerId) throw new AppError("Unauthorized", 403);

  const calendar = await prisma.marketingCalendar.create({
    data: {
      businessId,
      startDate: new Date(startDate),
      endDate: dayjs(startDate).add(days, "day").toDate(),
    },
  });

  const results: GeneratedPostResult[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = dayjs(startDate).add(i, "day");
    const theme = defaultThemes[i % defaultThemes.length];

    const variantsData: Prisma.JsonArray = [];
    let primaryPost: Prisma.ScheduledPostGetPayload<{}> | null = null;
    let primaryContent: MarketingContentPayload | undefined;
    let primaryBackgroundPrompt: string | undefined;
    let primaryTemplateId: string | null = null;

    for (let variantIndex = 0; variantIndex < variants; variantIndex += 1) {
      const marketing = await generateMarketingPost(business, theme);

      const orientation = marketing.layout_type
        ? (marketing.layout_type.toLowerCase() as TemplateOrientation)
        : undefined;
      const template = await recommendTemplate(businessId, {
        emotion: marketing.emotion,
        layoutType: orientation,
        style: business.preferredStyle ?? undefined,
      });

      if (!primaryPost) {
        primaryPost = await prisma.scheduledPost.create({
          data: {
            businessId,
            calendarId: calendar.id,
            date: date.toDate(),
            theme,
            title: marketing.title,
            subtitle: marketing.subtitle,
            caption: marketing.caption,
            hashtags: marketing.hashtags,
            emotion: marketing.emotion,
            backgroundUrl: null,
            layoutType: marketing.layout_type,
            templateId: template?.id,
            renderedImage: null,
            status: "PENDING",
          },
        });
        primaryContent = marketing;
        primaryBackgroundPrompt = marketing.background_prompt;
        primaryTemplateId = template?.id ?? null;
      } else {
        variantsData.push({
          theme,
          marketing: marketing as unknown as Prisma.JsonObject,
          backgroundPrompt: marketing.background_prompt,
          templateId: template?.id ?? null,
        } as Prisma.JsonObject);
      }
    }

    if (primaryPost && primaryContent && primaryBackgroundPrompt) {
      const allVariants: Prisma.JsonArray = [
        {
          theme,
          marketing: primaryContent as unknown as Prisma.JsonObject,
          backgroundPrompt: primaryBackgroundPrompt,
          templateId: primaryTemplateId,
        } as Prisma.JsonObject,
        ...variantsData,
      ];

      const updated = await prisma.scheduledPost.update({
        where: { id: primaryPost.id },
        data: { variants: allVariants as unknown as Prisma.InputJsonValue },
        include: { template: true },
      });
      results.push({
        post: updated,
        content: primaryContent!,
        backgroundPrompt: primaryBackgroundPrompt!,
        templateId: primaryTemplateId,
        variants: allVariants,
      });
    }
  }

  return { calendar, posts: results };
};

export const listScheduledPosts = async (businessId: string, ownerId?: string) => {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
  if (!business) throw new AppError("Business not found", 404);
  if (ownerId && business.ownerId !== ownerId) throw new AppError("Unauthorized", 403);

  const posts = await prisma.scheduledPost.findMany({
    where: { businessId },
    orderBy: { date: "asc" },
    include: { template: true },
  });

  return posts.map((post) => ({
    ...post,
    variants: Array.isArray(post.variants) ? post.variants : [],
  }));
};

