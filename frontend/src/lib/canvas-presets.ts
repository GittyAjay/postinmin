export interface CanvasPreset {
  id: string;
  label: string;
  orientation: "square" | "wide" | "story";
  width: number;
  height: number;
  description?: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: "instagram-post-square",
    label: "Instagram Post (1080 × 1080)",
    orientation: "square",
    width: 1080,
    height: 1080,
    description: "Versatile square post size recommended for Instagram feed, Facebook, and Pinterest squares.",
  },
  {
    id: "instagram-story",
    label: "Instagram Story / Reels (1080 × 1920)",
    orientation: "story",
    width: 1080,
    height: 1920,
    description: "Full-portrait canvas ideal for Stories, Reels, TikTok, and YouTube Shorts.",
  },
  {
    id: "facebook-landscape",
    label: "Facebook Landscape (1200 × 630)",
    orientation: "wide",
    width: 1200,
    height: 630,
    description: "Classic Facebook link preview dimensions that also work for Twitter and LinkedIn landscape posts.",
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post (1200 × 627)",
    orientation: "wide",
    width: 1200,
    height: 627,
    description: "Optimised for LinkedIn feed posts and article previews.",
  },
  {
    id: "twitter-post",
    label: "X / Twitter Post (1600 × 900)",
    orientation: "wide",
    width: 1600,
    height: 900,
    description: "High-resolution 16:9 canvas tailored for X / Twitter shares and YouTube thumbnails.",
  },
  {
    id: "pinterest-pin",
    label: "Pinterest Pin (1000 × 1500)",
    orientation: "story",
    width: 1000,
    height: 1500,
    description: "Tall 2:3 ratio pin that also suits blog graphics and infographics.",
  },
];

export const DEFAULT_CANVAS_PRESET_ID = CANVAS_PRESETS[0]?.id ?? "instagram-post-square";

export const findCanvasPresetById = (id: string | null | undefined) =>
  id ? CANVAS_PRESETS.find((preset) => preset.id === id) : undefined;

export const formatDimensions = (width: number, height: number) => `${width} × ${height}`;

export const inferCanvasPreset = (params: {
  canvasPreset?: string | null;
  canvasWidth?: number | null;
  canvasHeight?: number | null;
  orientation?: "square" | "wide" | "story";
}) => {
  const { canvasPreset, canvasWidth, canvasHeight, orientation } = params;
  const byId = findCanvasPresetById(canvasPreset ?? undefined);
  if (byId) return byId;
  if (canvasWidth && canvasHeight) {
    const match = CANVAS_PRESETS.find(
      (preset) => preset.width === canvasWidth && preset.height === canvasHeight,
    );
    if (match) return match;
  }
  if (orientation) {
    const fallback = CANVAS_PRESETS.find((preset) => preset.orientation === orientation);
    if (fallback) return fallback;
  }
  return CANVAS_PRESETS[0];
};

export const resolveCanvasDimensions = (params: {
  canvasPreset?: string | null;
  canvasWidth?: number | null;
  canvasHeight?: number | null;
  orientation?: "square" | "wide" | "story";
}) => {
  const preset = inferCanvasPreset(params);
  const width = params.canvasWidth ?? preset?.width ?? CANVAS_PRESETS[0].width;
  const height = params.canvasHeight ?? preset?.height ?? CANVAS_PRESETS[0].height;
  return { width, height, preset };
};
