const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8095";

/** Browser-facing API origin (public / SSR catalog calls) */
export function getPublicApiUrl(): string {
  return publicApiUrl;
}

/** Prefer server-side URL inside Docker; fall back to public URL */
export function getServerApiUrl(): string {
  return (
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8095"
  );
}

/**
 * @deprecated Token lives in httpOnly cookie; always null in the browser.
 */
export function getStoredTokenSafe(): string | null {
  return null;
}

export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: {
    server?: boolean;
    /** Presence means “use session”; value is never sent from the browser */
    token?: string | null;
    /** Seconds — enables Next ISR instead of no-store on server fetches */
    revalidate?: number;
  },
): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const isBrowser = typeof window !== "undefined";

  let url: string;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options?.server) {
    url = `${getServerApiUrl()}${normalized}`;
    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }
  } else if (isBrowser) {
    // Same-origin BFF: attaches httpOnly cookie as Bearer upstream
    url = `/api/proxy${normalized}`;
  } else {
    url = `${getPublicApiUrl()}${normalized}`;
    if (options?.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }
  }

  const useRevalidate =
    Boolean(options?.server) && typeof options?.revalidate === "number";

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: isBrowser && !options?.server ? "include" : init.credentials,
    ...(useRevalidate
      ? { next: { revalidate: options!.revalidate } }
      : options?.server
        ? { cache: "no-store" as RequestCache }
        : { cache: init.cache }),
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
