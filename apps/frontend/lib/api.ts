const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=")[1] ?? "") : "";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const csrf = getCookie("abhi2_csrf");
  if (csrf) headers.set("x-csrf-token", csrf);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data as T;
}

export const fetcher = <T>(path: string) => apiFetch<T>(path);
