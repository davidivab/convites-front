import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-cookies";

/**
 * Soft gate using the httpOnly session cookie set by the BFF.
 * Real authorization still happens on the Laravel API.
 *
 * Next.js 16: file convention renamed middleware → proxy.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/ingresar";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/crear",
    "/crear/:path*",
    "/moderacion",
    "/moderacion/:path*",
    "/admin",
    "/admin/:path*",
    "/registro-profesional",
    "/registro-profesional/:path*",
    "/perfil",
    "/perfil/:path*",
  ],
};
