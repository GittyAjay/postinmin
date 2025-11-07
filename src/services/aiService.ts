import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { generateMarketingPost } from "./deepseekService";
import { generateBackgroundImage } from "./imageGenService";
import { recommendTemplate } from "./templateService";
import { renderPost } from "./renderService";

export const generatePostPreview = async (businessId: string, theme: string, ownerId?: string) => {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError("Business not found", 404);
  if (ownerId && business.ownerId !== ownerId) throw new AppError("Unauthorized", 403);

  const marketing = await generateMarketingPost(business, theme);
  const backgroundUrl = await generateBackgroundImage(marketing.background_prompt);

  const template = await recommendTemplate(businessId, {
    emotion: marketing.emotion,
    style: business.preferredStyle ?? undefined,
    layoutType: marketing.layout_type as any,
  });

  const renderedImage = template
    ? await renderPost(
        {
          id: template.id,
          name: template.name,
          backgroundUrl: template.backgroundUrl ?? undefined,
          orientation: template.orientation,
          tags: template.tags,
          emotionFit: template.emotionFit,
          placeholders: template.placeholders as any,
        },
        backgroundUrl,
        {
          title: marketing.title,
          subtitle: marketing.subtitle,
          caption: marketing.caption,
          hashtags: marketing.hashtags,
          emotion: marketing.emotion,
        }
      )
    : "";

  return { marketing, backgroundUrl, template, renderedImage };
};

