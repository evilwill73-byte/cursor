import { prisma } from "@social-media/database";
import { withAdminAuth } from "@/lib/auth";
import { apiError, ok, paginated, getPagination } from "@/lib/response";
import { serializeVideo } from "@/lib/serializers";
import { z } from "zod";

async function resolveAdminAppId(
  admin: { role: string; appId: string | null },
  appSlug: string | null
) {
  if (admin.role === "app_admin") {
    if (!admin.appId) return null;
    return admin.appId;
  }
  if (!appSlug) return null;
  const app = await prisma.app.findUnique({ where: { slug: appSlug } });
  return app?.id ?? null;
}

export async function GET(req: Request) {
  return withAdminAuth(req, async (admin) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(searchParams);
    const appId = await resolveAdminAppId(admin, searchParams.get("app_id"));

    if (!appId) {
      return apiError("APP_REQUIRED", "app_id is required for video list", 400);
    }

    if (admin.role === "app_admin" && admin.appId !== appId) {
      return apiError("FORBIDDEN", "Access denied", 403);
    }

    const where = { appId };
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ]);

    const app = await prisma.app.findUniqueOrThrow({ where: { id: appId } });
    return paginated(
      videos.map((v) => serializeVideo(v, app.slug)),
      { page, limit, total }
    );
  });
}

const createVideoSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["long", "short"]),
  description: z.string().optional(),
  series_id: z.string().uuid().optional(),
  episode_number: z.number().int().optional(),
  app_id: z.string().optional(),
});

export async function POST(req: Request) {
  return withAdminAuth(req, async (admin) => {
    const body = createVideoSchema.safeParse(await req.json());
    if (!body.success) {
      return apiError("VALIDATION_ERROR", body.error.message, 400);
    }

    const appId = await resolveAdminAppId(admin, body.data.app_id ?? null);
    if (!appId) {
      return apiError("APP_REQUIRED", "app_id is required", 400);
    }

    if (admin.role === "app_admin" && admin.appId !== appId) {
      return apiError("FORBIDDEN", "Access denied", 403);
    }

    const video = await prisma.video.create({
      data: {
        appId,
        title: body.data.title,
        type: body.data.type,
        description: body.data.description,
        seriesId: body.data.series_id,
        episodeNumber: body.data.episode_number,
        status: "draft",
      },
    });

    return ok({ id: video.id, status: video.status });
  });
}

