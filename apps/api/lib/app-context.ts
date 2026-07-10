import bcrypt from "bcryptjs";
import { prisma } from "@social-media/database";
import type { AppContext } from "@social-media/types";
import { apiError } from "./response";

export async function resolveAppContext(
  appSlug: string | null,
  apiKey: string | null
): Promise<{ context: AppContext } | { error: ReturnType<typeof apiError> }> {
  if (!appSlug) {
    return {
      error: apiError("MISSING_APP_ID", "X-App-Id header is required", 400),
    };
  }

  if (!apiKey) {
    return {
      error: apiError("MISSING_API_KEY", "X-Api-Key header is required", 400),
    };
  }

  const app = await prisma.app.findFirst({
    where: { slug: appSlug, isActive: true },
  });

  if (!app) {
    return { error: apiError("APP_NOT_FOUND", "App not found or inactive", 404) };
  }

  const keys = await prisma.apiKey.findMany({
    where: { appId: app.id, isActive: true },
  });

  let valid = false;
  for (const key of keys) {
    if (key.expiresAt && key.expiresAt < new Date()) continue;
    if (await bcrypt.compare(apiKey, key.keyHash)) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    return { error: apiError("INVALID_API_KEY", "Invalid API key", 401) };
  }

  return {
    context: {
      appId: app.id,
      appSlug: app.slug,
    },
  };
}

export function getHeaders(req: Request) {
  return {
    appId: req.headers.get("x-app-id"),
    apiKey: req.headers.get("x-api-key"),
    authorization: req.headers.get("authorization"),
  };
}

export async function withAppContext(
  req: Request,
  handler: (ctx: AppContext) => Promise<Response>
): Promise<Response> {
  const { appId, apiKey } = getHeaders(req);
  const result = await resolveAppContext(appId, apiKey);
  if ("error" in result) return result.error;
  return handler(result.context);
}
