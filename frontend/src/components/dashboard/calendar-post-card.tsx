"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmotionBadge } from "./emotion-badge";
import { PostPreviewModal } from "./post-preview-modal";
import { ScheduledPost, Template } from "@/types/business";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPostCardProps {
  post: ScheduledPost;
  template?: Template;
  templates?: Template[];
  onTemplateChange?: (post: ScheduledPost, templateId: string | null) => void;
  isTemplateUpdating?: boolean;
  isPlaceholder?: boolean;
  isSelected?: boolean;
}

export const CalendarPostCard = ({
  post,
  template,
  templates = [],
  onTemplateChange,
  isTemplateUpdating = false,
  isPlaceholder = false,
  isSelected = false,
}: CalendarPostCardProps) => {
  const currentTemplateId = post.templateId ?? null;
  const value = currentTemplateId ?? "none";
  const templateExists =
    value === "none" || templates.some((candidate) => candidate.id === value);

  const handleTemplateChange = (nextValue: string) => {
    if (!onTemplateChange || isPlaceholder) return;
    const nextTemplateId = nextValue === "none" ? null : nextValue;
    if ((currentTemplateId ?? null) === nextTemplateId) return;
    onTemplateChange(post, nextTemplateId);
  };

  const card = (
    <Card
      className={cn(
        "flex h-full flex-col border-slate-200 shadow-sm transition hover:shadow-lg dark:border-slate-800",
        isSelected ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-400/60" : "",
      )}
    >
      <CardHeader className="space-y-2 bg-white/70 backdrop-blur">
        <CardDescription className="text-xs uppercase text-slate-500">
          {format(new Date(post.date), "MMM d, yyyy")}
        </CardDescription>
        <CardTitle className="text-base text-slate-800 dark:text-slate-100">{post.title ?? "Untitled concept"}</CardTitle>
        <EmotionBadge emotion={post.emotion} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{post.caption}</p>
          {post.hashtags?.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-blue-600">
              {post.hashtags.map((tag) => (
                <span key={tag}>#{tag.replace(/^#/, "")}</span>
              ))}
            </div>
          ) : null}
        </div>

        {!isPlaceholder ? (
          templates.length ? (
            <div
              className="space-y-1"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Template
              </p>
              <Select value={templateExists ? value : "none"} onValueChange={handleTemplateChange} disabled={isTemplateUpdating}>
                <SelectTrigger size="sm" className="w-full justify-between">
                  <SelectValue placeholder="Attach a template" />
                  {isTemplateUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> : null}
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="none">No template</SelectItem>
                  {!templateExists && value !== "none" ? (
                    <SelectItem value={value}>Unavailable template</SelectItem>
                  ) : null}
                  {templates.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p
              className="text-xs text-slate-400"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              Create a template to preview creative guidance.
            </p>
          )
        ) : null}
      </CardContent>
    </Card>
  );

  if (isPlaceholder) {
    return card;
  }

  return (
    <PostPreviewModal
      post={post}
      template={template}
      trigger={
        <div className="h-full cursor-pointer" role="button" tabIndex={0}>
          {card}
        </div>
      }
    />
  );
};

