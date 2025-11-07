export declare const generatePostPreview: (businessId: string, theme: string, ownerId?: string) => Promise<{
    marketing: import("./deepseekService").MarketingContentPayload;
    backgroundUrl: string;
    template: {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        placeholders: import("@prisma/client/runtime/library").JsonValue;
        backgroundUrl: string | null;
        orientation: import(".prisma/client").$Enums.TemplateOrientation;
        tags: string[];
        emotionFit: string[];
        businessId: string;
    };
    renderedImage: string;
}>;
//# sourceMappingURL=aiService.d.ts.map