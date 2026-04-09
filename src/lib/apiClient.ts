import { useAuthStore } from "@/stores/authStore";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5001/api/v1";

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, updateAccessToken, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    const newToken: string = data.data.accessToken;
    updateAccessToken(newToken);
    return newToken;
  } catch {
    clearAuth();
    return null;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Set to false for public endpoints (login, register) */
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: extraHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const execFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await execFetch();

  // Attempt one token refresh on 401
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await execFetch();
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? res.statusText);
  }

  return json as T;
}
