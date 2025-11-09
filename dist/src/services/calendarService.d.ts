import { Prisma } from "@prisma/client";
import { type MarketingContentPayload } from "./deepseekService";
export interface GenerateCalendarInput {
    businessId: string;
    startDate: string;
    days: number;
    variants?: number;
    ownerId?: string;
}
type ScheduledPostWithTemplate = Prisma.ScheduledPostGetPayload<{
    include: {
        template: true;
    };
}>;
interface GeneratedPostResult {
    post: ScheduledPostWithTemplate;
    content: MarketingContentPayload;
    backgroundPrompt: string;
    templateId: string | null;
    variants: Prisma.JsonArray;
}
export declare const generateCalendar: ({ businessId, startDate, days, variants, ownerId }: GenerateCalendarInput) => Promise<{
    calendar: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        startDate: Date;
        endDate: Date;
    };
    posts: GeneratedPostResult[];
}>;
interface ApplyTemplateInput {
    postId: string;
    templateId?: string | null;
    ownerId?: string;
}
export declare const applyTemplateToPost: ({ postId, templateId, ownerId }: ApplyTemplateInput) => Promise<{
    variants: Prisma.JsonArray;
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
    status: import(".prisma/client").$Enums.PostStatus;
}>;
export declare const listScheduledPosts: (businessId: string, ownerId?: string) => Promise<{
    variants: Prisma.JsonArray;
    template: {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        placeholders: Prisma.JsonValue;
        backgroundUrl: string | null;
        backgroundColor: string | null;
        orientation: import(".prisma/client").$Enums.TemplateOrientation;
        tags: string[];
        emotionFit: string[];
        canvasPreset: string | null;
        canvasWidth: number | null;
        canvasHeight: number | null;
        businessId: string;
    } | null;
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
    status: import(".prisma/client").$Enums.PostStatus;
}[]>;
export {};
//# sourceMappingURL=calendarService.d.ts.map