import bcrypt from "bcryptjs";
import { prisma } from "@social-media/database";
import { signAdminToken } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = loginSchema.safeParse(await req.json());
  if (!body.success) {
    return apiError("VALIDATION_ERROR", body.error.message, 400);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: body.data.email },
  });

  if (!admin || !(await bcrypt.compare(body.data.password, admin.passwordHash))) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  if (!admin.isActive) {
    return apiError("ADMIN_DISABLED", "Admin account is disabled", 403);
  }

  const token = await signAdminToken({
    sub: admin.id,
    role: admin.role,
    appId: admin.appId,
    email: admin.email,
  });

  return ok({
    accessToken: token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      app_id: admin.appId,
    },
  });
}
