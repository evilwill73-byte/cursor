import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { ok } from "@/lib/response";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    const [banners, rows] = await Promise.all([
      prisma.banner.findMany({
        where: { appId: ctx.appId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.homeRow.findMany({
        where: { appId: ctx.appId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return ok({
      banners: banners.map((b) => ({
        id: b.id,
        image_url: b.imageUrl,
        link_type: b.linkType,
        link_id: b.linkId,
      })),
      rows: rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        config: r.configJson,
      })),
    });
  });
}
