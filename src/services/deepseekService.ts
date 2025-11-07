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

const buildFallbackPayload = (business: Business, theme: string): MarketingContentPayload => ({
  title: `${theme} Spotlight for ${business.name}`,
  subtitle: business.goals ? `Goal: ${business.goals}` : "Engage your audience",
  caption:
    business.voiceTone && business.targetAudience
      ? `Share a ${business.voiceTone} message that resonates with ${business.targetAudience}.`
      : `Highlight why ${business.name} matters today.`,
  hashtags: ["#marketing", "#brand", `#${theme.replace(/\s+/g, "")}`],
  emotion: business.preferredEmotion ?? "joy",
  background_prompt: `vibrant ${business.preferredStyle ?? "modern"} scene evoking ${business.preferredEmotion ?? "joy"}`,
  layout_type: "square",
});

export async function generateMarketingPost(business: Business, theme: string): Promise<MarketingContentPayload> {
  const prompt = `
You are a social media strategist for "${business.name}" (${business.category ?? "business"}).
Brand voice: ${business.voiceTone ?? "friendly"}.
Goals: ${business.goals ?? "drive engagement and sales"}.
Brand colors: ${business.brandColors ?? ""}.
Target audience: ${business.targetAudience ?? ""}.
Preferred emotion: ${business.preferredEmotion ?? "joy"}.
Style: ${business.preferredStyle ?? "modern"}.
If available, align with this brand tone embedding: ${business.brandVoiceVector ?? ""}.
Generate JSON:
{
  "title": "...",
  "subtitle": "...",
  "caption": "...",
  "hashtags": ["#tag"],
  "emotion": "joy|trust|anticipation|luxury|calm|festive",
  "background_prompt": "a ${business.preferredStyle ?? "modern"} background evoking ${business.preferredEmotion ?? "joy"} emotion",
  "layout_type": "square|wide|story"
}`;

  if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_API_URL) {
    logger.warn("DeepSeek API credentials missing; using fallback marketing payload.");
    return buildFallbackPayload(business, theme);
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
      return buildFallbackPayload(business, theme);
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error("DeepSeek marketing generation failed; using fallback payload.", { error });
    return buildFallbackPayload(business, theme);
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

