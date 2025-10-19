import { auth } from "@/lib/auth";
import { getApiBase } from "@/lib/env";

export type BackendService = "visits" | "clients" | "notifications";

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

function buildUrl(service: BackendService, path: string): string {
  const base = getApiBase(service);
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase).toString();
}

async function getAccessToken(): Promise<string> {
  const session = await auth();
  if (!session || !session.access_token) {
    const error: ApiError = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }
  return session.access_token;
}

export async function backendFetch<T>(
  service: BackendService,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getAccessToken();
  const url = buildUrl(service, path);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error: ApiError = new Error(
      typeof data === "string" ? data : "Solicitud al backend falló"
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
