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
    const video = await prisma.video.findFirst({
      where: { id, appId: ctx.appId, status: "published" },
    });

    if (!video) {
      return apiError("NOT_FOUND", "Video not found", 404);
    }

    await prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return ok(serializeVideo(video, ctx.appSlug));
  });
}
