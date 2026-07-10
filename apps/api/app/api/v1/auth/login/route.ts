import bcrypt from "bcryptjs";
import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { signUserAccessToken, signUserRefreshToken } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  return withAppContext(req, async (ctx) => {
    const body = loginSchema.safeParse(await req.json());
    if (!body.success) {
      return apiError("VALIDATION_ERROR", body.error.message, 400);
    }

    const user = await prisma.user.findUnique({
      where: {
        email_appId: { email: body.data.email, appId: ctx.appId },
      },
    });

    if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return apiError("USER_DISABLED", "Account is disabled", 403);
    }

    const payload = { sub: user.id, appId: user.appId, email: user.email };
    const accessToken = await signUserAccessToken(payload);
    const refreshToken = await signUserRefreshToken(payload);
    const refreshHash = await bcrypt.hash(refreshToken, 12);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        appId: user.appId,
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return ok({ accessToken, refreshToken });
  });
}
