"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    REDIS_URL: zod_1.z.string().url().optional(),
    ENABLE_QUEUES: zod_1.z.coerce.boolean().default(false),
    DEEPSEEK_API_KEY: zod_1.z.string(),
    DEEPSEEK_API_URL: zod_1.z.string().url(),
    DEEPSEEK_CHAT_MODEL: zod_1.z.string().default("deepseek-chat"),
    DEEPSEEK_EMBED_MODEL: zod_1.z.string().default("deepseek-embedding"),
    IMAGE_GEN_API_KEY: zod_1.z.string().optional(),
    IMAGE_GEN_API_URL: zod_1.z.string().url().optional(),
    STORAGE_TYPE: zod_1.z.enum(["local", "cloudinary", "s3"]).default("local"),
    CLOUDINARY_URL: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
})
    .passthrough();
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map