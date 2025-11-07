"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBackgroundImage = generateBackgroundImage;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const FALLBACK_BACKGROUNDS = {
    joy: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1024&q=80",
    trust: "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1024&q=80",
    anticipation: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1024&q=80",
    luxury: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1024&q=80",
    calm: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1024&q=80",
    festive: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1024&q=80",
};
const pickFallbackBackground = (prompt) => {
    const entry = Object.entries(FALLBACK_BACKGROUNDS).find(([emotion]) => prompt.toLowerCase().includes(emotion));
    return entry?.[1] ?? FALLBACK_BACKGROUNDS.joy;
};
async function generateBackgroundImage(prompt) {
    if (!env_1.env.IMAGE_GEN_API_URL || !env_1.env.IMAGE_GEN_API_KEY) {
        logger_1.logger.warn("Image generation API not configured. Using fallback background.");
        return pickFallbackBackground(prompt);
    }
    try {
        const endpoint = env_1.env.IMAGE_GEN_API_URL.includes("/images")
            ? env_1.env.IMAGE_GEN_API_URL
            : `${env_1.env.IMAGE_GEN_API_URL.replace(/\/$/, "")}/images/generate`;
        const res = await axios_1.default.post(endpoint, {
            prompt,
            size: "1024x1024",
        }, { headers: { Authorization: `Bearer ${env_1.env.IMAGE_GEN_API_KEY}` } });
        const url = res.data?.data?.[0]?.url;
        if (!url) {
            logger_1.logger.warn("Image generation response missing URL. Using fallback background.");
            return pickFallbackBackground(prompt);
        }
        if (env_1.env.STORAGE_TYPE === "local") {
            const response = await axios_1.default.get(url, { responseType: "arraybuffer" });
            const buffer = Buffer.from(response.data);
            const fileName = `${(0, uuid_1.v4)()}.png`;
            const filePath = path_1.default.join("uploads", "backgrounds", fileName);
            await fs_1.default.promises.writeFile(filePath, buffer);
            return `/${filePath.replace(/\\/g, "/")}`;
        }
        // Placeholder for cloud storage integration
        return url;
    }
    catch (error) {
        logger_1.logger.error("Image generation failed; using fallback background.", { error });
        return pickFallbackBackground(prompt);
    }
}
//# sourceMappingURL=imageGenService.js.map