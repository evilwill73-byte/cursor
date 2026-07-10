import { ok } from "@/lib/response";

export async function GET() {
  return ok({
    status: "ok",
    service: "social-media-api",
    timestamp: new Date().toISOString(),
  });
}
