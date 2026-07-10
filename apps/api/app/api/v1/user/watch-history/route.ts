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
        prisma.watchHistory.findMany({
          where,
          include: { video: true },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.watchHistory.count({ where }),
      ]);

      return paginated(
        items.map((h) => ({
          video: serializeVideo(h.video, ctx.appSlug),
          progress_sec: h.progressSec,
          completed: h.completed,
          updated_at: h.updatedAt,
        })),
        { page, limit, total }
      );
    });
  });
}

const progressSchema = z.object({
  video_id: z.string().uuid(),
  progress_sec: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export async function POST(req: Request) {
  return withAppContext(req, async (ctx) => {
    return withUserAuth(req, ctx.appId, async (user) => {
      const body = progressSchema.safeParse(await req.json());
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

      const record = await prisma.watchHistory.upsert({
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
          progressSec: body.data.progress_sec,
          completed: body.data.completed ?? false,
        },
        update: {
          progressSec: body.data.progress_sec,
          completed: body.data.completed ?? false,
        },
      });

      return ok({
        video_id: record.videoId,
        progress_sec: record.progressSec,
        completed: record.completed,
      });
    });
  });
}
