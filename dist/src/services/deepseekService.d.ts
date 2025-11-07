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
export declare function generateMarketingPost(business: Business, theme: string): Promise<MarketingContentPayload>;
export declare function generateBrandVoiceEmbedding(text: string): Promise<number[]>;
//# sourceMappingURL=deepseekService.d.ts.map