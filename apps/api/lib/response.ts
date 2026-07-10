import { NextResponse } from "next/server";
import type { ApiError } from "@social-media/types";

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}

export function paginated<T>(
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  return NextResponse.json({ data, meta });
}

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
