import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { paginated, getPagination } from "@/lib/response";
import { serializeVideo } from "@/lib/serializers";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(searchParams);

    const where = {
      appId: ctx.appId,
      type: "short",
      status: "published",
    };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ]);

    return paginated(
      videos.map((v) => serializeVideo(v, ctx.appSlug)),
      { page, limit, total }
    );
  });
}
