import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    REDIS_URL: z.string().url().optional(),
    ENABLE_QUEUES: z.coerce.boolean().default(false),
    DEEPSEEK_API_KEY: z.string(),
    DEEPSEEK_API_URL: z.string().url(),
    DEEPSEEK_CHAT_MODEL: z.string().default("deepseek-chat"),
    DEEPSEEK_EMBED_MODEL: z.string().default("deepseek-embedding"),
    IMAGE_GEN_API_KEY: z.string().optional(),
    IMAGE_GEN_API_URL: z.string().url().optional(),
    STORAGE_TYPE: z.enum(["local", "cloudinary", "s3"]).default("local"),
    CLOUDINARY_URL: z.string().optional(),
    LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
    META_APP_ID: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
    META_GRAPH_API_VERSION: z.string().default("v21.0"),
    PUBLIC_APP_URL: z.string().url().optional(),
  })
  .passthrough();

export const env = envSchema.parse(process.env);

