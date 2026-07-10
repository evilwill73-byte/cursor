import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { paginated, getPagination } from "@/lib/response";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(searchParams);

    const where = { appId: ctx.appId, isActive: true };
    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip,
        take: limit,
      }),
      prisma.series.count({ where }),
    ]);

    return paginated(
      series.map((s) => ({
        id: s.id,
        app_id: ctx.appSlug,
        title: s.title,
        description: s.description,
        cover_url: s.coverUrl,
        type: s.type,
        is_premium: s.isPremium,
      })),
      { page, limit, total }
    );
  });
}
