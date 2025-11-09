"use client";

import Image from "next/image";
import { Template } from "@/types/business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { EmotionBadge } from "./emotion-badge";
import { formatDimensions, resolveCanvasDimensions } from "@/lib/canvas-presets";

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onUse?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  isDeleting?: boolean;
}

export const TemplateCard = ({ template, onEdit, onUse, onDelete, isDeleting }: TemplateCardProps) => {
  const canvas = resolveCanvasDimensions({
    canvasPreset: template.canvasPreset,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    orientation: template.orientation,
  });
  const presetLabel = canvas.preset?.label.split(" (")[0] ?? template.orientation.toUpperCase();
  const dimensionLabel = formatDimensions(canvas.width, canvas.height);
  const primaryEmotion = template.emotionFit[0];

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800">
      <CardHeader className="space-y-2 bg-slate-50 dark:bg-slate-900/40">
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <div className="flex flex-col gap-1">
            <span>{template.name}</span>
            {template.tags.length ? (
              <CardDescription className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-500">
                {template.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-200 px-2 py-0.5 dark:bg-slate-800">
                    {tag}
                  </span>
                ))}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {primaryEmotion ? <EmotionBadge emotion={primaryEmotion} /> : null}
            {onDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                    onClick={() => {
                      if (isDeleting) return;
                      onDelete(template);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium uppercase tracking-wide dark:bg-slate-800">
            {presetLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-900">
            {dimensionLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div
          className="relative h-40 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
          style={{ background: template.backgroundColor ?? "#0f172a" }}
        >
          {template.backgroundUrl ? (
            <Image
              alt={template.name}
              src={template.backgroundUrl}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-100">
              {template.backgroundColor ? "Background color applied" : "No background uploaded"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" className="flex-1" onClick={() => onEdit(template)}>
              Edit
            </Button>
          )}
          {onUse && (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onUse(template)}>
              Use Template
            </Button>
          )}
        </div>
        {isDeleting ? (
          <p className="text-center text-xs text-slate-500">Deleting…</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

