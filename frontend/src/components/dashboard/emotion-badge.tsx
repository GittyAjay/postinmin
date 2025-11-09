"use client";

import type { LucideIcon } from "lucide-react";
import { Gem, ShieldCheck, Smile, Sparkles, Stars, Target, Wind } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getEmotionColor } from "@/lib/emotions";

interface EmotionBadgeProps {
  emotion?: string;
}

export const EmotionBadge = ({ emotion }: EmotionBadgeProps) => {
  const color = getEmotionColor(emotion);
  const Icon = emotionToIcon(emotion);
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 rounded-full border-transparent px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-100"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} />
      <span className="capitalize">{emotion ?? "neutral"}</span>
    </Badge>
  );
};

const emotionToIcon = (emotion?: string): LucideIcon => {
  switch (emotion?.toLowerCase()) {
    case "joy":
      return Smile;
    case "trust":
      return ShieldCheck;
    case "anticipation":
      return Sparkles;
    case "luxury":
      return Gem;
    case "calm":
      return Wind;
    case "festive":
      return Stars;
    default:
      return Target;
  }
};

