"use client";

import { useEffect, useMemo, useRef } from "react";
import { addDays, format } from "date-fns";

import { CalendarPostCard } from "./calendar-post-card";
import { Business, ScheduledPost, Template } from "@/types/business";

interface CalendarGridProps {
  startDate: string;
  posts: ScheduledPost[];
  days: number;
  templates?: Template[];
  onTemplateChange?: (post: ScheduledPost, templateId: string | null) => void;
  templateChangeLoadingId?: string | null;
  selectedDate?: string | null;
  business?: Business | null;
}

export const CalendarGrid = ({
  startDate,
  posts,
  days,
  templates = [],
  onTemplateChange,
  templateChangeLoadingId,
  selectedDate,
  business,
}: CalendarGridProps) => {
  const postMap = useMemo(() => {
    const dict = new Map<string, ScheduledPost>();
    posts.forEach((post) => dict.set(format(new Date(post.date), "yyyy-MM-dd"), post));
    return dict;
  }, [posts]);

  const templateMap = useMemo(() => {
    const dict = new Map<string, Template>();
    templates.forEach((template) => dict.set(template.id, template));
    return dict;
  }, [templates]);

  const start = new Date(startDate);
  const totalDays = Math.max(1, days);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!selectedDate) return;
    const element = cardRefs.current.get(selectedDate);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedDate, totalDays, posts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: totalDays }).map((_, index) => {
        const date = addDays(start, index);
        const key = format(date, "yyyy-MM-dd");
        const existingPost = postMap.get(key);
        const template = existingPost?.templateId ? templateMap.get(existingPost.templateId) : undefined;

        const post =
          existingPost ??
          ({
            id: key,
            businessId: "",
            date: date.toISOString(),
            status: "PENDING",
            title: `No content scheduled for ${format(date, "MMMM d")}`,
            caption: "Generate to craft personalised copy, emotion, and artwork guidance.",
            variants: [],
          } as ScheduledPost);

        const isTemplateUpdating = templateChangeLoadingId === existingPost?.id;
        const isSelected = selectedDate === key;

        return (
          <div
            key={key}
            ref={(node) => {
              if (!node) {
                cardRefs.current.delete(key);
              } else {
                cardRefs.current.set(key, node);
              }
            }}
          >
            <CalendarPostCard
              post={post}
              template={template}
              templates={templates}
              onTemplateChange={onTemplateChange}
              isTemplateUpdating={isTemplateUpdating}
              isPlaceholder={!existingPost}
              isSelected={isSelected}
              business={business ?? undefined}
            />
          </div>
        );
      })}
    </div>
  );
};

