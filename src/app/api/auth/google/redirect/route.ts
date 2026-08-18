import { NextRequest, NextResponse } from "next/server"
import { forwardToLaravel } from "@/lib/bff"

/** Proxy: JSON `{ url }` del redirect OAuth Google (Laravel). Forward `intent`. */
export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent") || "login"
  const qs = new URLSearchParams({ intent })
  const upstream = await forwardToLaravel(
    `/api/auth/google/redirect?${qs.toString()}`,
    { method: "GET" },
  )
  const data = await upstream.json().catch(() => ({}))
  return NextResponse.json(data, { status: upstream.status })
}
