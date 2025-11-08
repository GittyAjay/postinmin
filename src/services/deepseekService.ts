import axios from "axios";

import type { Business } from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface MarketingContentPayload {
  title: string;
  subtitle: string;
  caption: string;
  hashtags: string[];
  emotion: string;
  background_prompt: string;
  layout_type: "square" | "wide" | "story";
}

export interface MarketingPostContext {
  theme: string;
  creativeAngle: string;
  emotion?: string;
  formatHint?: string;
  ctaFocus?: string;
  dayOfWeek?: string;
  narrativeHook?: string;
}

const brandHashtag = (business: Business) => `#${business.name.replace(/[^a-zA-Z0-9]/g, "") || "YourBrand"}`;

const inferLayoutFromHint = (hint?: string): MarketingContentPayload["layout_type"] => {
  if (!hint) return "square";
  const normalized = hint.toLowerCase();
  if (normalized.includes("story") || normalized.includes("vertical")) return "story";
  if (normalized.includes("wide") || normalized.includes("banner") || normalized.includes("landscape")) return "wide";
  return "square";
};

const buildFallbackPayload = (business: Business, context: MarketingPostContext): MarketingContentPayload => ({
  title: `${context.theme}: ${business.name}`,
  subtitle: context.creativeAngle,
  caption:
    context.narrativeHook ??
    `This ${context.dayOfWeek ?? "week"}, spotlight how ${business.name} delivers on ${context.theme.toLowerCase()} by ${context.creativeAngle.toLowerCase()}. ${context.ctaFocus ?? "Invite your audience to take the next step today."}`,
  hashtags: [
    brandHashtag(business),
    `#${context.theme.replace(/\s+/g, "")}`,
    "#GSTAutomation",
    "#SmartCompliance",
    "#GrowthMindset",
  ],
  emotion: context.emotion ?? business.preferredEmotion ?? "joy",
  background_prompt: `a ${business.preferredStyle ?? "modern"} visual showcasing ${context.creativeAngle.toLowerCase()} with ${context.emotion ?? business.preferredEmotion ?? "joy"} energy`,
  layout_type: inferLayoutFromHint(context.formatHint),
});

export async function generateMarketingPost(business: Business, context: MarketingPostContext): Promise<MarketingContentPayload> {
  const prompt = `
You are a social media strategist for "${business.name}" (${business.category ?? "business"}).
Brand voice: ${business.voiceTone ?? "friendly"}.
Goals: ${business.goals ?? "drive engagement and sales"}.
Brand colors: ${business.brandColors ?? ""}.
Target audience: ${business.targetAudience ?? ""}.
Preferred emotion: ${business.preferredEmotion ?? "joy"}.
Style: ${business.preferredStyle ?? "modern"}.
If available, align with this brand tone embedding: ${business.brandVoiceVector ?? ""}.

Creative brief for today's post:
- Theme focus: ${context.theme}.
- Creative angle: ${context.creativeAngle}.
- Desired emotion: ${context.emotion ?? business.preferredEmotion ?? "joy"}.
- Format hint: ${context.formatHint ?? "square social post"}.
- Day of week context: ${context.dayOfWeek ?? "today"}.
- Call-to-action priority: ${context.ctaFocus ?? "Encourage product engagement"}.
- Narrative hook inspiration: ${context.narrativeHook ?? "Open with a fresh hook tied to the day's context."}

Requirements:
1. Craft an original narrative highlighting the theme and creative angle above. Avoid generic phrasing such as "Effortless GST Filing" or "Stress-free compliance".
2. Start with a vivid hook that references ${context.dayOfWeek ?? "the day"} and the specific pain point solved.
3. Include a compelling CTA aligned with "${context.ctaFocus ?? "Encourage product engagement"}".
4. Recommend a production-ready background_prompt that matches the format hint.
5. Provide exactly five hashtags: include ${brandHashtag(business)} plus a mix of niche and broad tags relevant to the theme.
6. Set "emotion" to one of: joy, trust, anticipation, luxury, calm, festive.
7. Choose "layout_type" aligned with the format hint (story, square, or wide).

Return JSON:
{
  "title": "...",
  "subtitle": "...",
  "caption": "...",
  "hashtags": ["#tag"],
  "emotion": "joy|trust|anticipation|luxury|calm|festive",
  "background_prompt": "...",
  "layout_type": "square|wide|story"
}`;

  if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_API_URL) {
    logger.warn("DeepSeek API credentials missing; using fallback marketing payload.");
    return buildFallbackPayload(business, context);
  }

  try {
    const endpoint = env.DEEPSEEK_API_URL.endsWith("chat/completions")
      ? env.DEEPSEEK_API_URL
      : `${env.DEEPSEEK_API_URL.replace(/\/$/, "")}/chat/completions`;
    const res = await axios.post(
      endpoint,
      {
        model: env.DEEPSEEK_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an emotion-aware marketing strategist. Always return valid JSON matching the user's schema.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        stream: false,
      },
      { headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` } }
    );

    const content = res.data?.choices?.[0]?.message?.content;
    if (!content) {
      logger.warn("DeepSeek response missing content; using fallback payload.");
      return buildFallbackPayload(business, context);
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error("DeepSeek marketing generation failed; using fallback payload.", { error });
    return buildFallbackPayload(business, context);
  }
}

export async function generateBrandVoiceEmbedding(text: string): Promise<number[]> {
  if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_API_URL) {
    logger.warn("DeepSeek embedding credentials missing; returning empty vector.");
    return [];
  }

  try {
    const embeddingsEndpoint = env.DEEPSEEK_API_URL.includes("chat/completions")
      ? env.DEEPSEEK_API_URL.replace("chat/completions", "embeddings")
      : `${env.DEEPSEEK_API_URL.replace(/\/$/, "")}/embeddings`;
    const response = await axios.post(
      embeddingsEndpoint,
      {
        input: text,
        model: env.DEEPSEEK_EMBED_MODEL,
      },
      { headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` } }
    );

    const embedding = response.data?.data?.[0]?.embedding;
    if (!embedding) {
      logger.warn("DeepSeek embedding response missing data; returning empty vector.");
      return [];
    }

    return embedding;
  } catch (error) {
    logger.error("DeepSeek embedding generation failed; returning empty vector.", { error });
    return [];
  }
}

