import type { Business } from "@prisma/client";
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
export declare function generateMarketingPost(business: Business, context: MarketingPostContext): Promise<MarketingContentPayload>;
export declare function generateBrandVoiceEmbedding(text: string): Promise<number[]>;
//# sourceMappingURL=deepseekService.d.ts.map