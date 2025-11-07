export declare const checkQuota: (userId: string, quotaKey: string) => Promise<{
    plan: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        planType: import(".prisma/client").$Enums.PlanType;
        quota: import("@prisma/client/runtime/library").JsonValue | null;
        renewDate: Date | null;
        userId: string;
    };
    limit: null;
    usage: number;
} | {
    plan: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        planType: import(".prisma/client").$Enums.PlanType;
        quota: import("@prisma/client/runtime/library").JsonValue | null;
        renewDate: Date | null;
        userId: string;
    };
    limit: number;
    usage: number;
}>;
export declare const incrementQuota: (userId: string, quotaKey: string) => Promise<void>;
//# sourceMappingURL=monetizationService.d.ts.map