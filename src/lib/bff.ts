import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookies";
import { getServerApiUrl } from "@/lib/api";

export { AUTH_COOKIE, authCookieOptions };

export function laravelUrl(path: string): string {
  const base = getServerApiUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function forwardToLaravel(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const { token: _t, ...rest } = init;
  return fetch(laravelUrl(path), {
    ...rest,
    headers,
    cache: "no-store",
  });
}
