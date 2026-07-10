import { extractBearer, verifyAdminToken } from "@/lib/auth";
import { apiError, ok } from "@/lib/response";
import { prisma } from "@social-media/database";

export async function GET(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return apiError("UNAUTHORIZED", "Admin token required", 401);

  const admin = await verifyAdminToken(token);
  if (!admin) return apiError("INVALID_TOKEN", "Invalid admin token", 401);

  const record = await prisma.adminUser.findUnique({ where: { id: admin.sub } });
  if (!record) return apiError("NOT_FOUND", "Admin not found", 404);

  return ok({
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    app_id: record.appId,
  });
}
