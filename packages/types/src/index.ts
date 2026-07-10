export type VideoType = "long" | "short";
export type VideoStatus = "draft" | "processing" | "published" | "failed";
export type AdminRole = "super_admin" | "app_admin";

export interface AppContext {
  appId: string;
  appSlug: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
