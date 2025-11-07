export interface AnalyticsSummaryParams {
    businessId: string;
    emotion?: string;
}
export declare const getAnalyticsSummary: ({ businessId, emotion }: AnalyticsSummaryParams) => Promise<{
    totals: import(".prisma/client").Prisma.GetPostAnalyticsAggregateType<{
        where: {
            readonly post: {
                readonly emotion?: string | undefined;
                readonly businessId: string;
            };
        };
        _sum: {
            impressions: true;
            likes: true;
            downloads: true;
            edits: true;
        };
        _count: true;
    }>;
    perPost: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PostAnalyticsGroupByOutputType, "postId"[]> & {
        _sum: {
            impressions: number | null;
            likes: number | null;
        };
    })[];
}>;
//# sourceMappingURL=analyticsService.d.ts.map