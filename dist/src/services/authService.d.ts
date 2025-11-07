export interface SignupInput {
    email: string;
    password: string;
    name?: string;
    role?: "ADMIN" | "BUSINESS_OWNER";
}
export declare const signup: ({ email, password, name, role }: SignupInput) => Promise<{
    user: Omit<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            planType: import(".prisma/client").$Enums.PlanType;
            quota: import("@prisma/client/runtime/library").JsonValue | null;
            renewDate: Date | null;
            userId: string;
        } | null;
    } & {
        email: string;
        password: string;
        name: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }, "password">;
    token: string;
}>;
export declare const login: (email: string, password: string) => Promise<{
    user: Omit<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            planType: import(".prisma/client").$Enums.PlanType;
            quota: import("@prisma/client/runtime/library").JsonValue | null;
            renewDate: Date | null;
            userId: string;
        } | null;
    } & {
        email: string;
        password: string;
        name: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }, "password">;
    token: string;
}>;
export declare const generateToken: (payload: Express.UserClaims) => string;
//# sourceMappingURL=authService.d.ts.map