import { Prisma } from "@prisma/client";
import type { TemplateOrientation } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { generateMarketingPost, type MarketingContentPayload } from "./deepseekService";
import { recommendTemplate } from "./templateService";

const creativeFrameworks = [
  {
    theme: "Awareness",
    creativeAngle: "spotlight how the platform removes manual GST headaches with a celebratory reveal",
    emotion: "joy",
    formatHint: "square carousel contrasting pain vs. relief",
    ctaFocus: "Book a live walkthrough",
    narrativeHook: "Open with a question about the time your audience loses to manual filings.",
  },
  {
    theme: "Education",
    creativeAngle: "share a regulation update or GST tip in plain language with tactical guidance",
    emotion: "trust",
    formatHint: "square infographic with 3 quick tips",
    ctaFocus: "Download the compliance checklist",
    narrativeHook: "Lead with an insight accountants can pass to clients today.",
  },
  {
    theme: "Testimonial",
    creativeAngle: "feature a customer win with quantified time savings and peace of mind",
    emotion: "anticipation",
    formatHint: "story-style vertical success snapshot",
    ctaFocus: "Start the free trial",
    narrativeHook: "Hook the reader with the size of the results your customer achieved.",
  },
  {
    theme: "Community",
    creativeAngle: "invite pros to a webinar or peer roundtable with behind-the-scenes access",
    emotion: "joy",
    formatHint: "wide banner promoting an upcoming event",
    ctaFocus: "Register for the session",
    narrativeHook: "Highlight the collaborative energy accountants will experience.",
  },
  {
    theme: "Behind the Scenes",
    creativeAngle: "reveal the AI workflow or team diligence that guarantees accuracy",
    emotion: "calm",
    formatHint: "square product UI close-up with annotation callouts",
    ctaFocus: "Take the product tour",
    narrativeHook: "Start by reducing fear about compliance slips with your safeguards.",
  },
  {
    theme: "Promotion",
    creativeAngle: "announce a limited-time onboarding boost or premium feature unlock",
    emotion: "anticipation",
    formatHint: "square headline card with countdown motif",
    ctaFocus: "Claim the limited offer",
    narrativeHook: "Lead with urgency tied to an expiring bonus.",
  },
  {
    theme: "Thought Leadership",
    creativeAngle: "share an insight on the future of GST automation and advisory services",
    emotion: "trust",
    formatHint: "wide LinkedIn-style insight card",
    ctaFocus: "Read the full insight",
    narrativeHook: "Pose a provocative claim about tomorrow's compliance expectations.",
  },
  {
    theme: "Product Feature",
    creativeAngle: "spotlight the reconciliation dashboard with a metric proving ROI",
    emotion: "joy",
    formatHint: "square split layout showing metric and UI preview",
    ctaFocus: "See the dashboard in action",
    narrativeHook: "Kick off with the tangible number RapidGST impacts most.",
  },
];

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

  const calendarStart = new Date(startDate);
  const calendarEnd = dayjs(startDate).add(days, "day").toDate();

  await prisma.scheduledPost.deleteMany({
    where: {
      businessId,
      date: {
        gte: calendarStart,
        lt: calendarEnd,
      },
    },
  });

  const calendar = await prisma.marketingCalendar.create({
    data: {
      businessId,
      startDate: calendarStart,
      endDate: calendarEnd,
    },
  });

  const results: GeneratedPostResult[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = dayjs(startDate).add(i, "day");
    const framework = creativeFrameworks[i % creativeFrameworks.length];

    const variantsData: Prisma.JsonArray = [];
    let primaryPost: Prisma.ScheduledPostGetPayload<{}> | null = null;
    let primaryContent: MarketingContentPayload | undefined;
    let primaryBackgroundPrompt: string | undefined;
    let primaryTemplateId: string | null = null;

    for (let variantIndex = 0; variantIndex < variants; variantIndex += 1) {
      const marketing = await generateMarketingPost(business, {
        ...framework,
        emotion: framework.emotion ?? business.preferredEmotion ?? "joy",
        dayOfWeek: date.format("dddd"),
      });

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
            theme: framework.theme,
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
          theme: framework.theme,
          marketing: marketing as unknown as Prisma.JsonObject,
          backgroundPrompt: marketing.background_prompt,
          templateId: template?.id ?? null,
        } as Prisma.JsonObject);
      }
    }

    if (primaryPost && primaryContent && primaryBackgroundPrompt) {
      const allVariants: Prisma.JsonArray = [
        {
          theme: framework.theme,
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

interface ApplyTemplateInput {
  postId: string;
  templateId?: string | null;
  ownerId?: string;
}

const normaliseVariants = (variants: Prisma.JsonValue | null | undefined) =>
  Array.isArray(variants) ? variants : [];

export const applyTemplateToPost = async ({ postId, templateId, ownerId }: ApplyTemplateInput) => {
  const post = await prisma.scheduledPost.findUnique({
    where: { id: postId },
    include: { business: { select: { ownerId: true } } },
  });

  if (!post) {
    throw new AppError("Scheduled post not found", 404);
  }
  if (ownerId && post.business.ownerId !== ownerId) {
    throw new AppError("Unauthorized", 403);
  }

  let desiredTemplateId: string | null = templateId ?? null;

  if (desiredTemplateId) {
    const template = await prisma.template.findUnique({ where: { id: desiredTemplateId } });
    if (!template || template.businessId !== post.businessId) {
      throw new AppError("Template not found for this business", 404);
    }
  }

  const variants = normaliseVariants(post.variants).map((variant, index) => {
    if (index === 0 && typeof variant === "object" && variant !== null && !Array.isArray(variant)) {
      return {
        ...variant,
        templateId: desiredTemplateId,
      } as Prisma.JsonObject;
    }
    return variant;
  });

  const updated = await prisma.scheduledPost.update({
    where: { id: postId },
    data: {
      templateId: desiredTemplateId,
      variants: variants.length ? (variants as Prisma.InputJsonValue) : post.variants,
    },
  });

  return {
    ...updated,
    variants: normaliseVariants(updated.variants),
  };
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
    variants: normaliseVariants(post.variants),
  }));
};

