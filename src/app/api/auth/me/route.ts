import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, forwardToLaravel } from "@/lib/bff";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const upstream = await forwardToLaravel("/api/auth/me", {
    method: "GET",
    token,
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
