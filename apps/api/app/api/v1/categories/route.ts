import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { ok } from "@/lib/response";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    const categories = await prisma.category.findMany({
      where: { appId: ctx.appId },
      orderBy: { sortOrder: "asc" },
    });

    return ok(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        cover_url: c.coverUrl,
      }))
    );
  });
}
