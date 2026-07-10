import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { withUserAuth } from "@/lib/auth";
import { ok, paginated, getPagination, apiError } from "@/lib/response";
import { serializeVideo } from "@/lib/serializers";
import { z } from "zod";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    return withUserAuth(req, ctx.appId, async (user) => {
      const { searchParams } = new URL(req.url);
      const { page, limit, skip } = getPagination(searchParams);

      const where = { appId: ctx.appId, userId: user.sub };
      const [items, total] = await Promise.all([
        prisma.favorite.findMany({
          where,
          include: { video: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.favorite.count({ where }),
      ]);

      return paginated(
        items.map((f) => serializeVideo(f.video, ctx.appSlug)),
        { page, limit, total }
      );
    });
  });
}

const favoriteSchema = z.object({
  video_id: z.string().uuid(),
});

export async function POST(req: Request) {
  return withAppContext(req, async (ctx) => {
    return withUserAuth(req, ctx.appId, async (user) => {
      const body = favoriteSchema.safeParse(await req.json());
      if (!body.success) {
        return apiError("VALIDATION_ERROR", body.error.message, 400);
      }

      const video = await prisma.video.findFirst({
        where: {
          id: body.data.video_id,
          appId: ctx.appId,
          status: "published",
        },
      });
      if (!video) return apiError("NOT_FOUND", "Video not found", 404);

      await prisma.favorite.upsert({
        where: {
          appId_userId_videoId: {
            appId: ctx.appId,
            userId: user.sub,
            videoId: body.data.video_id,
          },
        },
        create: {
          appId: ctx.appId,
          userId: user.sub,
          videoId: body.data.video_id,
        },
        update: {},
      });

      return ok({ video_id: body.data.video_id, favorited: true });
    });
  });
}
