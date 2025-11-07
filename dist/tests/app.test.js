"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
describe("App", () => {
    let app;
    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/test";
        process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-key-123456";
        process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
        process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "test-key";
        process.env.DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/chat/completions";
        const mod = await Promise.resolve().then(() => __importStar(require("../src/app")));
        app = mod.default;
    });
    it("responds to /health", async () => {
        const res = await (0, supertest_1.default)(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});
//# sourceMappingURL=app.test.js.map