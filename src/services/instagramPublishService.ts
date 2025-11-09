import axios, { AxiosError } from "axios";

import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

const GRAPH_API_VERSION = env.META_GRAPH_API_VERSION ?? "v21.0";
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;
const MAX_CAPTION_LENGTH = 2200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCaption = (caption?: string | null, hashtags?: string[] | null) => {
  const parts: string[] = [];
  if (caption?.trim()) {
    parts.push(caption.trim());
  }
  if (hashtags?.length) {
    const normalized = hashtags
      .filter((tag) => Boolean(tag))
      .map((tag) => {
        const trimmed = `${tag ?? ""}`.trim();
        if (!trimmed) return null;
        return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      })
      .filter((value): value is string => Boolean(value));
    if (normalized.length) {
      parts.push(normalized.join(" "));
    }
  }

  const combined = parts.join("\n\n");
  if (combined.length <= MAX_CAPTION_LENGTH) {
    return combined;
  }
  return combined.slice(0, MAX_CAPTION_LENGTH);
};

const resolveImageUrl = (renderedImage: string, origin?: string | null) => {
  if (/^https?:\/\//i.test(renderedImage)) {
    return renderedImage;
  }

  const baseUrl = env.PUBLIC_APP_URL ?? origin;
  if (!baseUrl) {
    throw new AppError(
      "Unable to resolve a public URL for the rendered image. Set PUBLIC_APP_URL in your environment.",
      500,
    );
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = renderedImage.startsWith("/") ? renderedImage : `/${renderedImage}`;
  return `${normalizedBase}${normalizedPath}`;
};

const handleInstagramError = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    const message = axiosError.response?.data?.error?.message ?? axiosError.message ?? fallbackMessage;
    const statusCode = axiosError.response?.status ?? 502;
    throw new AppError(`Instagram API error: ${message}`, statusCode);
  }

  throw new AppError(fallbackMessage, 502);
};

interface PublishInstagramOptions {
  postId: string;
  ownerId: string;
  origin?: string | null;
}

export const publishPostToInstagram = async ({ postId, ownerId, origin }: PublishInstagramOptions) => {
  const post = await prisma.scheduledPost.findUnique({
    where: { id: postId },
    include: { business: true },
  });

  if (!post) {
    throw new AppError("Scheduled post not found", 404);
  }

  if (!post.business) {
    throw new AppError("Business not associated with this post", 400);
  }

  if (post.business.ownerId !== ownerId) {
    throw new AppError("You are not allowed to publish this post", 403);
  }

  if (!post.business.instagramBusinessId || !post.business.instagramAccessToken) {
    throw new AppError("Connect your Instagram professional account before publishing", 400);
  }

  if (!post.renderedImage) {
    throw new AppError("Render the creative before publishing to Instagram.", 400);
  }

  const caption = buildCaption(post.caption, post.hashtags);
  const imageUrl = resolveImageUrl(post.renderedImage, origin);

  const { instagramBusinessId, instagramAccessToken } = post.business;

  let containerId: string;
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE_URL}/${instagramBusinessId}/media`,
      {},
      {
        params: {
          access_token: instagramAccessToken,
          image_url: imageUrl,
          caption,
        },
      },
    );
    containerId = response.data?.id;
  } catch (error) {
    handleInstagramError(error, "Failed to create Instagram media container");
    return; // unreachable, but satisfies TypeScript
  }

  if (!containerId) {
    throw new AppError("Instagram did not return a media container ID", 502);
  }

  let statusCode = "IN_PROGRESS";
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const statusResponse = await axios.get(`${GRAPH_API_BASE_URL}/${containerId}`, {
        params: {
          access_token: instagramAccessToken,
          fields: "status_code",
        },
      });
      statusCode = statusResponse.data?.status_code ?? "IN_PROGRESS";
    } catch (error) {
      handleInstagramError(error, "Failed to check Instagram media container status");
    }

    if (statusCode === "FINISHED" || statusCode === "PUBLISHED") {
      break;
    }

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new AppError(`Instagram reported status ${statusCode} for the media container`, 502);
    }
  }

  if (statusCode !== "FINISHED" && statusCode !== "PUBLISHED") {
    throw new AppError("Instagram media was not ready to publish in time. Try again later.", 504);
  }

  let instagramPostId: string;
  try {
    const publishResponse = await axios.post(
      `${GRAPH_API_BASE_URL}/${instagramBusinessId}/media_publish`,
      {},
      {
        params: {
          access_token: instagramAccessToken,
          creation_id: containerId,
        },
      },
    );
    instagramPostId = publishResponse.data?.id;
  } catch (error) {
    handleInstagramError(error, "Failed to publish Instagram media");
    return;
  }

  if (!instagramPostId) {
    throw new AppError("Instagram did not return a media ID", 502);
  }

  const publishedAt = new Date();

  await prisma.scheduledPost.update({
    where: { id: post.id },
    data: {
      status: "ACTIVE",
      publishedAt,
      instagramPostId,
      instagramPublishedAt: publishedAt,
    },
  });

  await prisma.business.update({
    where: { id: post.businessId },
    data: {
      instagramLastPublishedAt: publishedAt,
    },
  });

  return {
    instagramPostId,
    publishedAt,
  };
};

