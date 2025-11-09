export interface Business {
  id: string;
  name: string;
  category?: string;
  targetAudience?: string;
  goals?: string;
  voiceTone?: string;
  brandColors?: string;
  logoUrl?: string;
  preferredEmotion?: string;
  preferredStyle?: string;
  voiceSampleText?: string;
  brandVoiceVector?: number[];
  preferredPlatforms: string[];
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  instagramBusinessId?: string | null;
  instagramTokenExpiresAt?: string | null;
  instagramLastPublishedAt?: string | null;
  instagramConnected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplatePlaceholder {
  key: string;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  fontSize?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  imageUrl?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  align?: "left" | "center" | "right";
  opacity?: number;
  rotation?: number;
  locked?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  zIndex?: number;
  shape?: "rectangle" | "circle" | "triangle" | "line";
  fillColor?: string;
  dashPattern?: number[];
  sampleText?: string;
}

export interface Template {
  id: string;
  businessId: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  orientation: "square" | "wide" | "story";
  tags: string[];
  emotionFit: string[];
  placeholders: TemplatePlaceholder[];
  frameBorderColor?: string;
  frameBorderWidth?: number;
  frameBorderRadius?: number;
  canvasPreset?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduledPostVariant {
  theme: string;
  marketing: Record<string, unknown>;
  backgroundPrompt?: string;
  templateId: string | null;
}

export interface ScheduledPost {
  id: string;
  businessId: string;
  calendarId?: string;
  date: string;
  theme?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  hashtags?: string[];
  emotion?: string;
  backgroundPrompt?: string;
  layoutType?: string;
  templateId?: string | null;
  renderedImage?: string | null;
  variants?: ScheduledPostVariant[];
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  publishedAt?: string | null;
  instagramPostId?: string | null;
  instagramPublishedAt?: string | null;
}

export interface AnalyticsSummary {
  totals: {
    _sum: {
      impressions: number | null;
      likes: number | null;
      downloads: number | null;
      edits: number | null;
    };
    _count: number;
  };
  perPost: Array<{
    postId: string;
    _sum: {
      impressions: number | null;
      likes: number | null;
    };
  }>;
}

