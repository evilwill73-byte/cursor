import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { ok } from "@/lib/response";

export async function GET(req: Request) {
  return withAppContext(req, async () => {
    const appSlug = req.headers.get("x-app-id")!;
    const app = await prisma.app.findUniqueOrThrow({
      where: { slug: appSlug },
    });

    return ok({
      slug: app.slug,
      name: app.name,
      bundle_id: app.bundleId,
      web_domain: app.webDomain,
      theme: app.themeJson,
      features: app.featuresJson,
    });
  });
}
