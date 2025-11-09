"use client";

import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Loader2, RefreshCcwIcon, LayersIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { api, endpoints } from "@/lib/api";
import { ScheduledPost } from "@/types/business";
import { showAIGenerationToast } from "@/components/dashboard/ai-status-toast";

const fetchPost = async (postId: string) => {
  const response = await api.get(`${endpoints.posts}/${postId}`);
  return response.data as ScheduledPost;
};

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;

  const { data: post, isLoading, refetch } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: Boolean(postId),
  });

  if (!postId) return notFound();

  const handleRegenerate = async () => {
    if (!post) return;
    const toastHandle = showAIGenerationToast("Reimagining caption with your brand voice…");
    try {
      await api.post(`/posts/${post.id}/regenerate`);
      toastHandle.dismiss("Caption regenerated");
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate";
      toastHandle.error(message);
    }
  };

  const handleSwitchTemplate = async () => {
    toast.info("Template selector coming soon — choose from saved layouts.");
  };

  if (isLoading || !post) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{post.title ?? "Untitled post"}</h1>
          <p className="text-sm text-slate-500">{post.theme}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSwitchTemplate}>
            <LayersIcon className="mr-2 h-4 w-4" />
            Change template
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleRegenerate}>
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            Regenerate caption
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Copy</CardTitle>
              <CardDescription>Emotion-driven captions ready for your next rollout.</CardDescription>
            </div>
            <EmotionBadge emotion={post.emotion} />
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            {post.subtitle ? (
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Subtitle</p>
                <p className="text-base font-medium text-slate-800 dark:text-slate-100">{post.subtitle}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Caption</p>
              <p className="whitespace-pre-line text-sm leading-6">{post.caption}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Hashtags</p>
              <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                {post.hashtags?.map((tag) => (
                  <span key={tag}>#{tag.replace(/^#/, "")}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Background prompt:</span> {post.backgroundPrompt ?? "Not generated"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Rendered creative</CardTitle>
            <CardDescription>Preview or download the composite image.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              {post.renderedImage ? (
                <Image src={post.renderedImage} alt={post.title ?? "Rendered creative"} fill className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-500">
                  Render in progress. Queue the render worker to see the final image.
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-4 w-full border-blue-200 text-blue-600">
              Download
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

