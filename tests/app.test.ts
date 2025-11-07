import type { Express } from "express";
import request from "supertest";

describe("App", () => {
  let app: Express;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/test";
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-key-123456";
    process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
    process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "test-key";
    process.env.DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/chat/completions";
    const mod = await import("../src/app");
    app = mod.default;
  });

  it("responds to /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

