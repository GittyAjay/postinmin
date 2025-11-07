"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarketingPost = generateMarketingPost;
exports.generateBrandVoiceEmbedding = generateBrandVoiceEmbedding;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const buildFallbackPayload = (business, theme) => ({
    title: `${theme} Spotlight for ${business.name}`,
    subtitle: business.goals ? `Goal: ${business.goals}` : "Engage your audience",
    caption: business.voiceTone && business.targetAudience
        ? `Share a ${business.voiceTone} message that resonates with ${business.targetAudience}.`
        : `Highlight why ${business.name} matters today.`,
    hashtags: ["#marketing", "#brand", `#${theme.replace(/\s+/g, "")}`],
    emotion: business.preferredEmotion ?? "joy",
    background_prompt: `vibrant ${business.preferredStyle ?? "modern"} scene evoking ${business.preferredEmotion ?? "joy"}`,
    layout_type: "square",
});
async function generateMarketingPost(business, theme) {
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
    if (!env_1.env.DEEPSEEK_API_KEY || !env_1.env.DEEPSEEK_API_URL) {
        logger_1.logger.warn("DeepSeek API credentials missing; using fallback marketing payload.");
        return buildFallbackPayload(business, theme);
    }
    try {
        const endpoint = env_1.env.DEEPSEEK_API_URL.endsWith("chat/completions")
            ? env_1.env.DEEPSEEK_API_URL
            : `${env_1.env.DEEPSEEK_API_URL.replace(/\/$/, "")}/chat/completions`;
        const res = await axios_1.default.post(endpoint, {
            model: env_1.env.DEEPSEEK_CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an emotion-aware marketing strategist. Always return valid JSON matching the user's schema.",
                },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            stream: false,
        }, { headers: { Authorization: `Bearer ${env_1.env.DEEPSEEK_API_KEY}` } });
        const content = res.data?.choices?.[0]?.message?.content;
        if (!content) {
            logger_1.logger.warn("DeepSeek response missing content; using fallback payload.");
            return buildFallbackPayload(business, theme);
        }
        return JSON.parse(content);
    }
    catch (error) {
        logger_1.logger.error("DeepSeek marketing generation failed; using fallback payload.", { error });
        return buildFallbackPayload(business, theme);
    }
}
async function generateBrandVoiceEmbedding(text) {
    if (!env_1.env.DEEPSEEK_API_KEY || !env_1.env.DEEPSEEK_API_URL) {
        logger_1.logger.warn("DeepSeek embedding credentials missing; returning empty vector.");
        return [];
    }
    try {
        const embeddingsEndpoint = env_1.env.DEEPSEEK_API_URL.includes("chat/completions")
            ? env_1.env.DEEPSEEK_API_URL.replace("chat/completions", "embeddings")
            : `${env_1.env.DEEPSEEK_API_URL.replace(/\/$/, "")}/embeddings`;
        const response = await axios_1.default.post(embeddingsEndpoint, {
            input: text,
            model: env_1.env.DEEPSEEK_EMBED_MODEL,
        }, { headers: { Authorization: `Bearer ${env_1.env.DEEPSEEK_API_KEY}` } });
        const embedding = response.data?.data?.[0]?.embedding;
        if (!embedding) {
            logger_1.logger.warn("DeepSeek embedding response missing data; returning empty vector.");
            return [];
        }
        return embedding;
    }
    catch (error) {
        logger_1.logger.error("DeepSeek embedding generation failed; returning empty vector.", { error });
        return [];
    }
}
//# sourceMappingURL=deepseekService.js.map