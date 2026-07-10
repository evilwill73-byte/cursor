import type { ApiResponse } from "@social-media/types";

export interface SoCalMedicClientConfig {
  baseUrl: string;
  appId: string;
  apiKey: string;
}

export class SoCalMedicClient {
  private accessToken: string | null = null;

  constructor(private readonly config: SoCalMedicClientConfig) {}

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-App-Id": this.config.appId,
      "X-Api-Key": this.config.apiKey,
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message ?? "Request failed");
    }
    return json as T;
  }

  app = {
    getConfig: () =>
      this.request<ApiResponse<Record<string, unknown>>>("/api/v1/app/config"),
  };

  auth = {
    register: (body: { email: string; password: string; name?: string }) =>
      this.request<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        "/api/v1/auth/register",
        { method: "POST", body: JSON.stringify(body) }
      ),
    login: (body: { email: string; password: string }) =>
      this.request<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        "/api/v1/auth/login",
        { method: "POST", body: JSON.stringify(body) }
      ),
    me: () =>
      this.request<ApiResponse<Record<string, unknown>>>("/api/v1/auth/me"),
  };

  videos = {
    list: (params?: { type?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set("type", params.type);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      return this.request<ApiResponse<unknown[]>>(
        `/api/v1/videos${qs ? `?${qs}` : ""}`
      );
    },
    get: (id: string) =>
      this.request<ApiResponse<Record<string, unknown>>>(`/api/v1/videos/${id}`),
  };

  home = {
    get: () =>
      this.request<ApiResponse<{ banners: unknown[]; rows: unknown[] }>>(
        "/api/v1/home"
      ),
  };

  shorts = {
    getFeed: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      return this.request<ApiResponse<unknown[]>>(
        `/api/v1/shorts/feed${qs ? `?${qs}` : ""}`
      );
    },
  };
}

export * from "@social-media/types";
