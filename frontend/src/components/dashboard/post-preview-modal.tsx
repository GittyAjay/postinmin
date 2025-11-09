"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmotionBadge } from "./emotion-badge";
import { Business, ScheduledPost, Template } from "@/types/business";
import { TemplateCanvas, TEMPLATE_DIMENSIONS } from "@/components/template/template-canvas";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { api, endpoints, type ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

interface PostPreviewModalProps {
  post: ScheduledPost;
  template?: Template;
  trigger?: React.ReactNode;
  business?: Business;
}

export const PostPreviewModal = ({ post, template, trigger, business }: PostPreviewModalProps) => {
  const [open, setOpen] = useState(false);
  const [showGuides, setShowGuides] = useState(!template);
  const router = useRouter();
  const stageRef = useRef<KonvaStage | null>(null);
  const queryClient = useQueryClient();

  const publishInstagramMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(endpoints.postPublishInstagram(post.id));
      return response.data as { instagramPostId: string; publishedAt?: string };
    },
    onSuccess: () => {
      toast.success("Post published to Instagram");
      queryClient.invalidateQueries(queryKeys.calendar(post.businessId));
      queryClient.invalidateQueries(queryKeys.posts(post.businessId));
      queryClient.invalidateQueries(queryKeys.business);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const message =
        apiError?.response?.data?.message ?? (error instanceof Error ? error.message : "Failed to publish to Instagram");
      toast.error(message);
    },
  });

  const publishToInstagram = () => {
    if (publishInstagramMutation.isPending) {
      return;
    }
    if (!business?.instagramConnected) {
      toast("Connect your Instagram account in Business → Identity to enable publishing.");
      return;
    }
    if (!post.renderedImage) {
      toast.error("Render this post before publishing to Instagram.");
      return;
    }
    publishInstagramMutation.mutate();
  };

  const shareContext = useMemo(() => {
    const segments: string[] = [];
    if (post.title?.trim()) {
      segments.push(post.title.trim());
    }
    if (post.caption?.trim()) {
      segments.push(post.caption.trim());
    }
    const text = segments.join("\n\n");
    let url: string | null = null;
    if (post.renderedImage && /^https?:\/\//.test(post.renderedImage)) {
      url = post.renderedImage;
    } else if (typeof window !== "undefined") {
      url = `${window.location.origin}/dashboard/calendar`;
    }

    return {
      text,
      url,
    };
  }, [post.caption, post.renderedImage, post.title]);

  useEffect(() => {
    setShowGuides(!template);
  }, [template]);

  const waitForNextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "template";

  const handleTemplateDownload = async (format: "png" | "json") => {
    if (!template) {
      toast.error("Attach a template before downloading.");
      return;
    }

    const filenameBase = slugify(template.name ?? post.title ?? "calendar-template");

    if (format === "json") {
      const exportPayload = {
        ...template,
        backgroundUrl: template.backgroundUrl ?? null,
        backgroundColor: template.backgroundColor ?? null,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenameBase}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Template JSON downloaded");
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      toast.error("Preview is still loading. Try again in a moment.");
      return;
    }

    const guidesWereVisible = showGuides;
    if (guidesWereVisible) {
      setShowGuides(false);
      await waitForNextFrame();
    }

    try {
      const baseDimensions = TEMPLATE_DIMENSIONS[template.orientation];
      const currentWidth = stage.width();
      const pixelRatio =
        currentWidth > 0 ? Math.max(1, baseDimensions.width / currentWidth) : Math.max(1, 1 / Math.max(stage.scaleX(), 0.01));
      const dataUrl = stage.toDataURL({ pixelRatio });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filenameBase}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Template PNG downloaded");
    } catch (error) {
      console.error("Failed to export template preview", error);
      toast.error("Unable to download image. Ensure background assets allow downloads.");
    } finally {
      if (guidesWereVisible) {
        await waitForNextFrame();
        setShowGuides(true);
      }
    }
  };

  const handleShare = async (platform: "facebook" | "linkedin" | "instagram") => {
    if (typeof window === "undefined") {
      toast.error("Sharing is only available in the browser.");
      return;
    }

    const openPopup = (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=700");
    };

    const { url: shareUrl, text: shareText } = shareContext;
    if (platform === "facebook") {
      if (shareUrl) {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}${
          shareText ? `&quote=${encodeURIComponent(shareText)}` : ""
        }`;
        openPopup(url);
        toast.success("Opened Facebook share window");
      } else if (business?.facebookUrl) {
        window.open(business.facebookUrl, "_blank", "noopener,noreferrer");
        toast.success("Opened your Facebook page");
      } else {
        toast("Add a Facebook page in your business profile to enable quick sharing.");
      }
      return;
    }

    if (platform === "linkedin") {
      if (shareUrl) {
        const params = new URLSearchParams({
          mini: "true",
          url: shareUrl,
        });
        if (post.title) {
          params.set("title", post.title);
        }
        if (shareText) {
          params.set("summary", shareText);
        }
        openPopup(`https://www.linkedin.com/shareArticle?${params.toString()}`);
        toast.success("Opened LinkedIn share window");
      } else if (business?.linkedinUrl) {
        window.open(business.linkedinUrl, "_blank", "noopener,noreferrer");
        toast.success("Opened your LinkedIn page");
      } else {
        toast("Add a LinkedIn page in your business profile to enable quick sharing.");
      }
      return;
    }

    if (platform === "instagram") {
      const caption = shareText || post.caption || post.title || "";
      if (caption) {
        try {
          await navigator.clipboard.writeText(caption);
          toast.success("Caption copied for Instagram");
        } catch {
          toast.error("Unable to copy caption. Paste manually in Instagram.");
        }
      } else {
        toast("No caption to copy — add text before sharing.");
      }
      const destination = business?.instagramUrl ?? "https://www.instagram.com/";
      window.open(destination, "_blank", "noopener,noreferrer");
      toast.success("Paste the caption into Instagram to finish publishing.");
    }
  };

  const templateContent = useMemo(() => {
    if (!template) return undefined;
    const map: Record<string, { text?: string; imageUrl?: string }> = {};
    const assignText = (key: string, value?: string | null) => {
      if (!value) return;
      map[key] = { ...(map[key] ?? {}), text: value };
    };
    const assignImage = (key: string, value?: string | null) => {
      if (!value) return;
      map[key] = { ...(map[key] ?? {}), imageUrl: value };
    };

    assignText("title", post.title ?? undefined);
    assignText("subtitle", post.subtitle ?? undefined);
    assignText("caption", post.caption ?? undefined);

    const placeholderLookup = new Map(template.placeholders.map((placeholder) => [placeholder.key, placeholder]));

    const marketing = post.variants?.[0]?.marketing as Record<string, unknown> | undefined;
    if (marketing) {
      Object.entries(marketing).forEach(([key, value]) => {
        if (typeof value !== "string") return;
        const placeholder = placeholderLookup.get(key);
        if (placeholder?.type === "image" || /^https?:\/\//.test(value)) {
          assignImage(key, value);
        } else {
          assignText(key, value);
        }
      });
    }

    if (post.renderedImage) {
      template.placeholders
        .filter((placeholder) => placeholder.type === "image")
        .forEach((placeholder) => {
          assignImage(placeholder.key, post.renderedImage ?? undefined);
        });
    }

    template.placeholders.forEach((placeholder) => {
      if (placeholder.type !== "text") return;
      const existing = map[placeholder.key]?.text;
      if (existing && existing.trim().length > 0) return;
      const keyLower = placeholder.key.toLowerCase();
      const sampleLower = (placeholder.sampleText ?? "").toLowerCase();
      if (keyLower.includes("title") || sampleLower.includes("title")) {
        assignText(placeholder.key, post.title ?? undefined);
        return;
      }
      if (keyLower.includes("subtitle") || keyLower.includes("sub_title") || sampleLower.includes("subtitle")) {
        assignText(placeholder.key, post.subtitle ?? undefined);
        return;
      }
      if (
        keyLower.includes("caption") ||
        keyLower.includes("body") ||
        keyLower.includes("description") ||
        sampleLower.includes("caption")
      ) {
        assignText(placeholder.key, post.caption ?? undefined);
        return;
      }
    });

    if (process.env.NODE_ENV !== "production") {
      try {
        console.groupCollapsed("[PostPreview] Placeholder mapping debug");
        console.log("Template ID:", template.id);
        console.log("Placeholders:", template.placeholders.map((placeholder) => ({
          key: placeholder.key,
          type: placeholder.type,
          sampleText: placeholder.sampleText,
        })));
        console.log("Post fields:", {
          title: post.title,
          subtitle: post.subtitle,
          caption: post.caption,
        });
        console.log("Resolved map:", map);
        console.groupEnd();
      } catch {
        // Swallow logging errors in case console.groupCollapsed is unavailable.
      }
    }

    return Object.keys(map).length ? map : undefined;
  }, [post.caption, post.renderedImage, post.subtitle, post.title, post.variants, template]);

  const orientation = template?.orientation ?? "square";
  const previewAspect =
    orientation === "wide" ? 3 / 2 : orientation === "story" ? 9 / 16 : 1;
  const previewScale = orientation === "wide" ? 0.34 : orientation === "story" ? 0.42 : 0.45;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full border-blue-200 text-blue-600">
            Preview Render
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl lg:max-w-4xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Post Preview</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {post.theme}
            <EmotionBadge emotion={post.emotion} />
          </DialogDescription>
          <div className="flex flex-wrap justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem onClick={() => void handleShare("facebook")}>Share to Facebook</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleShare("linkedin")}>Share to LinkedIn</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={publishToInstagram} disabled={publishInstagramMutation.isPending}>
                  {publishInstagramMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {business?.instagramConnected ? "Publish to Instagram" : "Connect Instagram to enable publishing"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleShare("instagram")}>
                  Copy caption &amp; open Instagram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  disabled={!template}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => void handleTemplateDownload("png")} disabled={!template}>
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleTemplateDownload("json")} disabled={!template}>
                  Download as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {template ? (
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  const params = new URLSearchParams({ templateId: template.id });
                  if (templateContent) {
                    params.set("content", JSON.stringify(templateContent));
                  }
                  params.set("returnTo", encodeURIComponent(`/dashboard/calendar`));
                  router.push(`/dashboard/templates?${params.toString()}`);
                }}
              >
                Open in Template Editor
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <div className="flex flex-col gap-6">
            <div className="mx-auto w-full max-w-md">
              <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900">
                <div
                  className={cn(
                    "relative w-full overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-slate-200/40 dark:bg-slate-950 dark:ring-slate-800/60",
                  )}
                  style={{ aspectRatio: previewAspect }}
                >
                  {post.renderedImage ? (
                    <Image src={post.renderedImage} alt={post.title ?? "Rendered creative"} fill className="object-cover" />
                  ) : template ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TemplateCanvas
                        template={template}
                        onPlaceholderUpdate={() => {}}
                        scale={previewScale}
                        className="w-full"
                        interactive={false}
                        content={templateContent}
                        showPlaceholderGuides={showGuides}
                        onStageReady={(stage) => {
                          stageRef.current = stage;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-900/60">
                      Attach a template to preview layout guidance.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Creative notes</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                This preview reflects the selected template{templateContent ? " with your scheduled content" : ""}. Adjust
                placeholders in the editor to fine-tune copy, imagery, and layout before exporting.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-slate-500">Title</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{post.title}</p>
            </div>
            {post.subtitle && (
              <div>
                <p className="text-xs uppercase text-slate-500">Subtitle</p>
                <p className="text-base text-slate-600 dark:text-slate-300">{post.subtitle}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-slate-500">Caption</p>
              <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{post.caption}</p>
            </div>
            {post.hashtags && (
              <div className="flex flex-wrap gap-2 text-sm text-blue-600">
                {post.hashtags.map((tag) => (
                  <span key={tag}>#{tag.replace(/^#/, "")}</span>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <span className="font-medium text-slate-700 dark:text-slate-200">Background prompt: </span>
              {post.backgroundPrompt ?? "Not provided"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

