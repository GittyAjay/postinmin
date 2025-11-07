"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPost = renderPost;
const canvas_1 = require("canvas");
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const emotion_1 = require("../utils/emotion");
const orientationSizeMap = {
    square: { width: 1024, height: 1024 },
    wide: { width: 1280, height: 720 },
    story: { width: 1080, height: 1920 },
};
async function renderPost(template, backgroundUrl, content) {
    const { width, height } = orientationSizeMap[template.orientation];
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const ctx = canvas.getContext("2d");
    const contentRecord = content;
    if (backgroundUrl) {
        const resolved = backgroundUrl.startsWith("http")
            ? backgroundUrl
            : path_1.default.join(process.cwd(), backgroundUrl.replace(/^\//, ""));
        const bgImage = await (0, canvas_1.loadImage)(resolved);
        ctx.drawImage(bgImage, 0, 0, width, height);
    }
    else {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, width, height);
    }
    const tintColor = (0, emotion_1.getEmotionColor)(content.emotion);
    ctx.fillStyle = tintColor;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    for (const placeholder of template.placeholders) {
        if (placeholder.type === "text") {
            const value = contentRecord[placeholder.key];
            if (!value)
                continue;
            const text = Array.isArray(value) ? value.join(" ") : String(value);
            ctx.fillStyle = placeholder.color ?? "#ffffff";
            ctx.font = `${placeholder.fontSize ?? 32}px "Arial"`;
            ctx.fillText(text, placeholder.x, placeholder.y);
        }
        // Image placeholders would require additional compositing from content assets.
    }
    const buffer = canvas.toBuffer("image/png");
    const outputName = `${(0, uuid_1.v4)()}.png`;
    const outputPath = path_1.default.join("uploads", "rendered", outputName);
    await (0, sharp_1.default)(buffer).png({ compressionLevel: 9 }).toFile(outputPath);
    return `/${outputPath.replace(/\\/g, "/")}`;
}
//# sourceMappingURL=renderService.js.map