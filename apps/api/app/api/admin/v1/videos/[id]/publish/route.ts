import { prisma } from "@social-media/database";
import { withAdminAuth } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { buildHlsPath } from "@/lib/r2";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdminAuth(req, async (admin) => {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return apiError("NOT_FOUND", "Video not found", 404);

    if (admin.role === "app_admin" && admin.appId !== video.appId) {
      return apiError("FORBIDDEN", "Access denied", 403);
    }

    if (!video.rawPath) {
      return apiError("NO_RAW_FILE", "Upload raw video before publishing", 400);
    }

    const job = await prisma.transcodeJob.create({
      data: {
        videoId: video.id,
        appId: video.appId,
        status: "queued",
        inputPath: video.rawPath,
        outputPath: buildHlsPath(video.id),
      },
    });

    await prisma.video.update({
      where: { id },
      data: { status: "processing" },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.sub,
        action: "video.publish",
        appId: video.appId,
        targetId: video.id,
        metadataJson: { jobId: job.id },
      },
    });

    return ok({ job_id: job.id, status: "processing" });
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdminAuth(req, async (admin) => {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return apiError("NOT_FOUND", "Video not found", 404);

    if (admin.role === "app_admin" && admin.appId !== video.appId) {
      return apiError("FORBIDDEN", "Access denied", 403);
    }

    await prisma.video.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
