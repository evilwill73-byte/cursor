import bcrypt from "bcryptjs";
import { prisma } from "@social-media/database";
import { withAppContext } from "@/lib/app-context";
import { signUserAccessToken, signUserRefreshToken } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  return withAppContext(req, async (ctx) => {
    const body = registerSchema.safeParse(await req.json());
    if (!body.success) {
      return apiError("VALIDATION_ERROR", body.error.message, 400);
    }

    const existing = await prisma.user.findUnique({
      where: {
        email_appId: { email: body.data.email, appId: ctx.appId },
      },
    });
    if (existing) {
      return apiError("EMAIL_EXISTS", "Email already registered for this app", 409);
    }

    const user = await prisma.user.create({
      data: {
        appId: ctx.appId,
        email: body.data.email,
        passwordHash: await bcrypt.hash(body.data.password, 12),
        name: body.data.name,
      },
    });

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
