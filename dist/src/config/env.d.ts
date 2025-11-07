export declare const env: {
    [x: string]: unknown;
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    ENABLE_QUEUES: boolean;
    DEEPSEEK_API_KEY: string;
    DEEPSEEK_API_URL: string;
    DEEPSEEK_CHAT_MODEL: string;
    DEEPSEEK_EMBED_MODEL: string;
    STORAGE_TYPE: "local" | "cloudinary" | "s3";
    LOG_LEVEL: "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";
    REDIS_URL?: string | undefined;
    IMAGE_GEN_API_KEY?: string | undefined;
    IMAGE_GEN_API_URL?: string | undefined;
    CLOUDINARY_URL?: string | undefined;
};
//# sourceMappingURL=env.d.ts.map