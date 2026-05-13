// =============================================
// FloodSense LK — Centralized API Client
// Routes through Kong API gateway:
//   /v1/sensors, /v1/anomalies   → sensor-service
//   /v1/predictions, /v1/alerts  → intelligence-service
//   /v1/zones, /v1/shelters      → zone-service
//   /api/...                     → main api (admin, auth, webhooks)
// =============================================

import type { User } from './types';

// Kong gateway base URL (no trailing slash, no /api suffix)
const GATEWAY_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:80";

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const clerk = (
      window as unknown as {
        Clerk?: {
          session?: {
            getToken: (options?: { template?: string }) => Promise<string>;
          };
        };
      }
    ).Clerk;
    if (!clerk?.session) return null;
    // Must pass a JWT template so the token includes publicMetadata (role).
    // Default Clerk session tokens do not include custom metadata claims.
    const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE;
    return await clerk.session.getToken(template ? { template } : undefined);
  } catch {
    return null;
  }
}

async function fetcher<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GATEWAY_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function mutate<T>(
  method: "POST" | "PATCH" | "DELETE",
  endpoint: string,
  data?: unknown,
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${GATEWAY_BASE}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---- Public API ----
export const api = {
  users: {
    getZone: (clerkId: string) =>
      fetcher<{ data: { zone_id: string } }>(`/v1/users/${clerkId}/zone`),
  },

  sensors: {
    list: (zoneId?: string | null) =>
      zoneId
        ? fetcher(`/v1/sensors/zone/${zoneId}/`)
        : fetcher("/v1/sensors"),
    get: (id: string) => fetcher(`/v1/sensors/${id}`),
    history: (
      id: string,
      params?: { from?: string; to?: string; interval?: string },
    ) =>
      fetcher(`/v1/sensors/${id}/history`, params as Record<string, string>),
    create: (data: unknown) => mutate("POST", "/api/admin/sensors", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/api/admin/sensors/${id}`, data),
    deactivate: (id: string) => mutate("DELETE", `/api/admin/sensors/${id}`),
  },

  zones: {
    list: async (zoneId?: string | null) => {
      if (zoneId) {
        const res = await fetcher<{ data: any }>(`/v1/zones/${zoneId}`);
        return { ...res, data: res.data ? [res.data] : [] };
      }
      return fetcher("/v1/zones");
    },
    get: (id: string) => fetcher(`/v1/zones/${id}`),
    create: (data: unknown) => mutate("POST", "/api/admin/zones", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/api/admin/zones/${id}`, data),
    deactivate: (id: string) => mutate("DELETE", `/api/admin/zones/${id}`),
  },

  shelters: {
    create: (data: unknown) => mutate("POST", "/api/admin/shelters", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/api/admin/shelters/${id}`, data),
    remove: (id: string) => mutate("DELETE", `/api/admin/shelters/${id}`),
  },

  alerts: {
    list: (
      params?: { severity?: string; status?: string; zone_id?: string },
      zoneId?: string | null,
    ) =>
      zoneId
        ? fetcher(`/v1/zones/${zoneId}/alerts`, params as Record<string, string>)
        : fetcher("/v1/alerts", params as Record<string, string>),
  },

  predictions: {
    list: (
      params?: { severity?: string; zone_id?: string; timeframe?: string },
      zoneId?: string | null,
    ) =>
      zoneId
        ? fetcher(
            `/v1/zones/${zoneId}/predictions`,
            params as Record<string, string>,
          )
        : fetcher("/v1/predictions", params as Record<string, string>),
  },

  anomalies: {
    list: (
      params?: { status?: string; sensor_id?: string },
      zoneId?: string | null,
    ) =>
      zoneId
        ? fetcher(
            `/v1/anomalies/${zoneId}`,
            params as Record<string, string>,
          )
        : fetcher("/v1/anomalies", params as Record<string, string>),
    resolve: (
      id: string,
      data: { status: string; resolution_note: string; resolved_by: string },
    ) => mutate("PATCH", `/api/admin/anomalies/${id}`, data),
  },

  auth: {
    me: () => fetcher("/api/auth/me"),
  },

  admin: {
    users: {
      list: (params?: { page?: number; page_size?: number }) =>
        fetcher<{ data: User[]; total: number; total_pages: number; page: number }>(
          "/api/admin/users",
          params
            ? Object.fromEntries(
                Object.entries(params).map(([k, v]) => [k, String(v)])
              )
            : undefined,
        ),
      create: (data: unknown) => mutate<unknown>("POST", "/api/admin/users", data),
      update: (clerkId: string, data: unknown) =>
        mutate<unknown>("PATCH", `/api/admin/users/${clerkId}`, data),
      deactivate: (clerkId: string) =>
        mutate<unknown>("DELETE", `/api/admin/users/${clerkId}`),
    },
  },
};
