// =============================================
// FloodSense LK — Centralized API Client
// All requests go through the API gateway (URL from env)
// =============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    // Get JWT from Clerk's loaded session
    const clerk = (
      window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      }
    ).Clerk;
    if (!clerk?.session) return null;
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

async function fetcher<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
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

  const res = await fetch(`${API_BASE}${endpoint}`, {
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
  sensors: {
    list: () => fetcher("/sensors"),
    get: (id: string) => fetcher(`/sensors/${id}`),
    history: (
      id: string,
      params?: { from?: string; to?: string; interval?: string },
    ) => fetcher(`/sensors/${id}/history`, params as Record<string, string>),
    create: (data: unknown) => mutate("POST", "/admin/sensors", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/admin/sensors/${id}`, data),
    deactivate: (id: string) => mutate("DELETE", `/admin/sensors/${id}`),
  },

  zones: {
    list: () => fetcher("/zones"),
    get: (id: string) => fetcher(`/zones/${id}`),
    create: (data: unknown) => mutate("POST", "/admin/zones", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/admin/zones/${id}`, data),
    deactivate: (id: string) => mutate("DELETE", `/admin/zones/${id}`),
  },

  shelters: {
    create: (data: unknown) => mutate("POST", "/admin/shelters", data),
    update: (id: string, data: unknown) =>
      mutate("PATCH", `/admin/shelters/${id}`, data),
    remove: (id: string) => mutate("DELETE", `/admin/shelters/${id}`),
  },

  alerts: {
    list: (params?: { severity?: string; status?: string; zone_id?: string }) =>
      fetcher('/alerts', params as Record<string, string>),
    resolve: (id: string, data: { status: string; resolution_note: string; resolved_by: string }) =>
      mutate('PATCH', `/admin/alerts/${id}`, data),
  },

  predictions: {
    list: (params?: {
      severity?: string;
      zone_id?: string;
      timeframe?: string;
    }) => fetcher("/predictions", params as Record<string, string>),
  },

  anomalies: {
    list: (params?: { status?: string; sensor_id?: string }) =>
      fetcher("/anomalies", params as Record<string, string>),
    resolve: (
      id: string,
      data: { status: string; resolution_note: string; resolved_by: string },
    ) => mutate("PATCH", `/admin/anomalies/${id}`, data),
  },
};
