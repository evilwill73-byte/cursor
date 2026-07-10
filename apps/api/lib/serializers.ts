import { prisma } from "@social-media/database";
import { getPublicVideoUrl } from "./r2";

export function serializeVideo(
  video: {
    id: string;
    appId: string;
    seriesId: string | null;
    episodeNumber: number | null;
    title: string;
    description: string | null;
    type: string;
    durationSec: number | null;
    thumbnailUrl: string | null;
    hlsPath: string | null;
    status: string;
    isPremium: boolean;
    viewCount: bigint;
    publishedAt: Date | null;
    createdAt: Date;
  },
  appSlug: string
) {
  return {
    id: video.id,
    app_id: appSlug,
    series_id: video.seriesId,
    episode_number: video.episodeNumber,
    title: video.title,
    description: video.description,
    type: video.type,
    duration_sec: video.durationSec,
    thumbnail_url: video.thumbnailUrl,
    hls_url: getPublicVideoUrl(appSlug, video.hlsPath),
    status: video.status,
    is_premium: video.isPremium,
    view_count: Number(video.viewCount),
    published_at: video.publishedAt,
    created_at: video.createdAt,
  };
}

export async function getAppSlug(appId: string) {
  const app = await prisma.app.findUnique({ where: { id: appId } });
  return app?.slug ?? "";
}
