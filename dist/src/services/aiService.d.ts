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
        backgroundColor: string | null;
        orientation: import(".prisma/client").$Enums.TemplateOrientation;
        tags: string[];
        emotionFit: string[];
        canvasPreset: string | null;
        canvasWidth: number | null;
        canvasHeight: number | null;
        businessId: string;
    };
    renderedImage: string;
}>;
//# sourceMappingURL=aiService.d.ts.map