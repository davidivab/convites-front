import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookies";
import { getServerApiUrl } from "@/lib/api";

export { AUTH_COOKIE, authCookieOptions };

export function laravelUrl(path: string): string {
  const base = getServerApiUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function forwardToLaravel(
  path: string,
  init: RequestInit & { token?: string | null; clientRequest?: Request } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  // Para que Laravel throttle por IP del navegador, no por la del Node BFF.
  if (init.clientRequest) {
    const incoming = init.clientRequest.headers;
    const forwarded =
      incoming.get("x-forwarded-for") ??
      incoming.get("x-real-ip") ??
      incoming.get("cf-connecting-ip");
    if (forwarded) {
      headers.set("X-Forwarded-For", forwarded.split(",")[0]!.trim());
    }
  }

  const { token: _t, clientRequest: _c, ...rest } = init;
  return fetch(laravelUrl(path), {
    ...rest,
    headers,
    cache: "no-store",
  });
}
