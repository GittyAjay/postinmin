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
export {};
//# sourceMappingURL=calendarService.d.ts.map