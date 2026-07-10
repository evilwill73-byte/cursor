import { prisma } from "@social-media/database";
import { withAdminAuth } from "@/lib/auth";
import { apiError, ok, paginated, getPagination } from "@/lib/response";

export async function GET(req: Request) {
  return withAdminAuth(req, async (admin) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(searchParams);
    const appIdFilter = searchParams.get("app_id");

    let appId: string | undefined;
    if (admin.role === "super_admin") {
      if (appIdFilter) {
        const app = await prisma.app.findUnique({ where: { slug: appIdFilter } });
        appId = app?.id;
      }
    } else {
      appId = admin.appId ?? undefined;
    }

    const where = appId ? { id: appId } : {};

    const [apps, total] = await Promise.all([
      prisma.app.findMany({
        where: appId ? { id: appId } : {},
        skip: admin.role === "super_admin" && !appId ? skip : 0,
        take: admin.role === "super_admin" && !appId ? limit : 1,
        orderBy: { createdAt: "desc" },
      }),
      prisma.app.count({ where }),
    ]);

    return paginated(
      apps.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        bundle_id: a.bundleId,
        is_active: a.isActive,
      })),
      { page, limit, total }
    );
  });
}

export async function POST(req: Request) {
  return withAdminAuth(
    req,
    async (admin) => {
      const body = await req.json();
      const { slug, name, bundle_id, web_domain } = body;

      if (!slug || !name) {
        return apiError("VALIDATION_ERROR", "slug and name are required", 400);
      }

      const app = await prisma.app.create({
        data: {
          slug,
          name,
          bundleId: bundle_id,
          webDomain: web_domain,
          themeJson: body.theme ?? {},
          featuresJson: body.features ?? { shorts: true },
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminUserId: admin.sub,
          action: "app.create",
          appId: app.id,
          targetId: app.id,
        },
      });

      return ok({ id: app.id, slug: app.slug, name: app.name });
    },
    { superAdminOnly: true }
  );
}
