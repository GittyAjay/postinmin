import { createCanvas, loadImage } from "canvas";
import path from "path";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

import { TemplateLayout } from "../types/template";
import { getEmotionColor } from "../utils/emotion";

const orientationSizeMap: Record<TemplateLayout["orientation"], { width: number; height: number }> = {
  square: { width: 1024, height: 1024 },
  wide: { width: 1280, height: 720 },
  story: { width: 1080, height: 1920 },
};

export interface RenderContent {
  title: string;
  subtitle?: string;
  caption?: string;
  hashtags?: string[];
  emotion?: string;
}

export async function renderPost(
  template: TemplateLayout,
  backgroundUrl: string,
  content: RenderContent
): Promise<string> {
  const { width, height } = orientationSizeMap[template.orientation];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const contentRecord = content as unknown as Record<string, unknown>;

  if (backgroundUrl) {
    const resolved = backgroundUrl.startsWith("http")
      ? backgroundUrl
      : path.join(process.cwd(), backgroundUrl.replace(/^\//, ""));
    const bgImage = await loadImage(resolved);
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
  }

  const tintColor = getEmotionColor(content.emotion);
  ctx.fillStyle = tintColor;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  for (const placeholder of template.placeholders) {
    if (placeholder.type === "text") {
      const value = contentRecord[placeholder.key];
      if (!value) continue;

      const text = Array.isArray(value) ? value.join(" ") : String(value);
      ctx.fillStyle = placeholder.color ?? "#ffffff";
      ctx.font = `${placeholder.fontSize ?? 32}px "Arial"`;
      ctx.fillText(text, placeholder.x, placeholder.y);
    }
    // Image placeholders would require additional compositing from content assets.
  }

  const buffer = canvas.toBuffer("image/png");
  const outputName = `${uuid()}.png`;
  const outputPath = path.join("uploads", "rendered", outputName);

  await sharp(buffer).png({ compressionLevel: 9 }).toFile(outputPath);

  return `/${outputPath.replace(/\\/g, "/")}`;
}

