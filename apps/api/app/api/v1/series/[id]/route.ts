import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { apiError, ok } from "@/lib/response";
import { serializeVideo } from "@/lib/serializers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAppContext(req, async (ctx) => {
    const series = await prisma.series.findFirst({
      where: { id, appId: ctx.appId, isActive: true },
      include: {
        videos: {
          where: { status: "published" },
          orderBy: { episodeNumber: "asc" },
        },
      },
    });

    if (!series) {
      return apiError("NOT_FOUND", "Series not found", 404);
    }

    return ok({
      id: series.id,
      app_id: ctx.appSlug,
      title: series.title,
      description: series.description,
      cover_url: series.coverUrl,
      type: series.type,
      is_premium: series.isPremium,
      episodes: series.videos.map((v) => serializeVideo(v, ctx.appSlug)),
    });
  });
}
