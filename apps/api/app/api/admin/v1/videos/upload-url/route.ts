import { prisma } from "@social-media/database";
import { withAdminAuth } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { buildRawVideoKey, createPresignedUploadUrl } from "@/lib/r2";
import { z } from "zod";

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  content_type: z.string().default("video/mp4"),
  video_id: z.string().uuid(),
  app_id: z.string().optional(),
});

export async function POST(req: Request) {
  return withAdminAuth(req, async (admin) => {
    const body = uploadUrlSchema.safeParse(await req.json());
    if (!body.success) {
      return apiError("VALIDATION_ERROR", body.error.message, 400);
    }

    const app = await prisma.app.findFirst({
      where: {
        ...(body.data.app_id ? { slug: body.data.app_id } : {}),
        ...(admin.role === "app_admin" && admin.appId
          ? { id: admin.appId }
          : {}),
      },
    });

    if (!app) return apiError("APP_NOT_FOUND", "App not found", 404);

    const video = await prisma.video.findFirst({
      where: { id: body.data.video_id, appId: app.id },
    });
    if (!video) return apiError("NOT_FOUND", "Video not found", 404);

    const key = buildRawVideoKey(app.slug, video.id, body.data.filename);
    const uploadUrl = await createPresignedUploadUrl(key, body.data.content_type);

    if (!uploadUrl) {
      return apiError(
        "R2_NOT_CONFIGURED",
        "R2 storage is not configured on server",
        503
      );
    }

    await prisma.video.update({
      where: { id: video.id },
      data: { rawPath: key },
    });

    return ok({ upload_url: uploadUrl, video_id: video.id, r2_key: key });
  });
}
