import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getUserSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return encoder.encode(secret);
}

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set");
  return encoder.encode(secret);
}

export interface UserTokenPayload {
  sub: string;
  appId: string;
  email: string;
}

export interface AdminTokenPayload {
  sub: string;
  role: string;
  appId: string | null;
  email: string;
}

export async function signUserAccessToken(payload: UserTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m")
    .sign(getUserSecret());
}

export async function signUserRefreshToken(payload: UserTokenPayload) {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "30d")
    .sign(getUserSecret());
}

export async function verifyUserToken(
  token: string
): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getUserSecret());
    return {
      sub: payload.sub as string,
      appId: payload.appId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function signAdminToken(payload: AdminTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.ADMIN_JWT_EXPIRES_IN ?? "8h")
    .sign(getAdminSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminSecret());
    return {
      sub: payload.sub as string,
      role: payload.role as string,
      appId: (payload.appId as string) ?? null,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function withUserAuth(
  req: Request,
  appContextAppId: string,
  handler: (user: UserTokenPayload) => Promise<Response>
): Promise<Response> {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Bearer token required" } },
      { status: 401 }
    );
  }

  const user = await verifyUserToken(token);
  if (!user) {
    return Response.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
      { status: 401 }
    );
  }

  if (user.appId !== appContextAppId) {
    return Response.json(
      {
        error: {
          code: "APP_MISMATCH",
          message: "Token does not belong to this app",
        },
      },
      { status: 403 }
    );
  }

  return handler(user);
}

export async function withAdminAuth(
  req: Request,
  handler: (admin: AdminTokenPayload) => Promise<Response>,
  options?: { superAdminOnly?: boolean; appId?: string }
): Promise<Response> {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Admin token required" } },
      { status: 401 }
    );
  }

  const admin = await verifyAdminToken(token);
  if (!admin) {
    return Response.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid admin token" } },
      { status: 401 }
    );
  }

  if (options?.superAdminOnly && admin.role !== "super_admin") {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Super admin only" } },
      { status: 403 }
    );
  }

  if (
    options?.appId &&
    admin.role === "app_admin" &&
    admin.appId !== options.appId
  ) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Access denied for this app" } },
      { status: 403 }
    );
  }

  return handler(admin);
}
