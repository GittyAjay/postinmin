export const emotionColorMap: Record<string, string> = {
  joy: "#FFD166",
  trust: "#118AB2",
  anticipation: "#ef476f",
  luxury: "#d4af37",
  calm: "#06d6a0",
  festivity: "#ff9f1c",
};

export const getEmotionColor = (emotion?: string) => {
  if (!emotion) return "#FFFFFF";
  return emotionColorMap[emotion.toLowerCase()] ?? "#FFFFFF";
};

