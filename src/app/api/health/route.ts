import { NextResponse } from "next/server";

/** Liveness for Docker/Dokploy — no dependency on the Laravel API. */
export function GET() {
  return NextResponse.json({ ok: true, service: "convites-front" });
}
