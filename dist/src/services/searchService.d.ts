export declare const searchPosts: (businessId: string, query: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    backgroundUrl: string | null;
    businessId: string;
    templateId: string | null;
    emotion: string | null;
    layoutType: string | null;
    calendarId: string | null;
    theme: string | null;
    title: string | null;
    subtitle: string | null;
    caption: string | null;
    hashtags: string[];
    renderedImage: string | null;
    variants: import("@prisma/client/runtime/library").JsonValue | null;
    status: import(".prisma/client").$Enums.PostStatus;
}[]>;
//# sourceMappingURL=searchService.d.ts.map