import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { withUserAuth } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function GET(req: Request) {
  return withAppContext(req, async (ctx) => {
    return withUserAuth(req, ctx.appId, async (token) => {
      const user = await prisma.user.findUnique({ where: { id: token.sub } });
      if (!user) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }
      return ok({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
      });
    });
  });
}
