import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

import { env } from "../config/env";
import { logger } from "../utils/logger";

const FALLBACK_BACKGROUNDS: Record<string, string> = {
  joy: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1024&q=80",
  trust: "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1024&q=80",
  anticipation: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1024&q=80",
  luxury: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1024&q=80",
  calm: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1024&q=80",
  festive: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1024&q=80",
};

const pickFallbackBackground = (prompt: string) => {
  const entry = Object.entries(FALLBACK_BACKGROUNDS).find(([emotion]) =>
    prompt.toLowerCase().includes(emotion)
  );
  return entry?.[1] ?? FALLBACK_BACKGROUNDS.joy;
};

export async function generateBackgroundImage(prompt: string): Promise<string> {
  if (!env.IMAGE_GEN_API_URL || !env.IMAGE_GEN_API_KEY) {
    logger.warn("Image generation API not configured. Using fallback background.");
    return pickFallbackBackground(prompt);
  }

  try {
    const endpoint = env.IMAGE_GEN_API_URL.includes("/images")
      ? env.IMAGE_GEN_API_URL
      : `${env.IMAGE_GEN_API_URL.replace(/\/$/, "")}/images/generate`;

    const res = await axios.post(
      endpoint,
      {
        prompt,
        size: "1024x1024",
      },
      { headers: { Authorization: `Bearer ${env.IMAGE_GEN_API_KEY}` } }
    );

    const url = res.data?.data?.[0]?.url;
    if (!url) {
      logger.warn("Image generation response missing URL. Using fallback background.");
      return pickFallbackBackground(prompt);
    }

    if (env.STORAGE_TYPE === "local") {
      const response = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);
      const fileName = `${uuid()}.png`;
      const filePath = path.join("uploads", "backgrounds", fileName);
      await fs.promises.writeFile(filePath, buffer);
      return `/${filePath.replace(/\\/g, "/")}`;
    }

    // Placeholder for cloud storage integration
    return url;
  } catch (error) {
    logger.error("Image generation failed; using fallback background.", { error });
    return pickFallbackBackground(prompt);
  }
}

