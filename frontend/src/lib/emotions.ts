export const emotionPalette: Record<string, string> = {
  joy: "#FACC15",
  trust: "#2563EB",
  anticipation: "#F97316",
  luxury: "#C084FC",
  calm: "#22D3EE",
  festive: "#FB7185",
  default: "#94A3B8",
};

export const getEmotionColor = (emotion?: string) =>
  emotion ? emotionPalette[emotion.toLowerCase()] ?? emotionPalette.default : emotionPalette.default;

