import { NextResponse } from "next/server"
import { AUTH_COOKIE, authCookieOptions, forwardToLaravel } from "@/lib/bff"

/** Canjea código de un solo uso por cookie httpOnly (token Sanctum). */
export async function POST(request: Request) {
  const body = await request.text()
  const upstream = await forwardToLaravel("/api/auth/google/exchange", {
    method: "POST",
    body,
  })

  const data = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status })
  }

  const token = typeof data.token === "string" ? data.token : null
  if (!token) {
    return NextResponse.json(
      { message: "La API no devolvió token de sesión." },
      { status: 502 },
    )
  }

  const res = NextResponse.json({ user: data.user })
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set(AUTH_COOKIE, token, authCookieOptions(secure))
  return res
}
