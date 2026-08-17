/** Cookie names for Next BFF auth (token never readable from JS). */
export const AUTH_COOKIE = "convites_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — align with Sanctum

export function authCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}
