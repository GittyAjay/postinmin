export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare const assertExists: <T>(value: T | undefined | null, message: string) => T;
//# sourceMappingURL=errors.d.ts.map