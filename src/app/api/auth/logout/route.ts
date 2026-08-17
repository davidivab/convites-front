import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, forwardToLaravel } from "@/lib/bff";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;

  if (token) {
    await forwardToLaravel("/api/auth/logout", {
      method: "POST",
      token,
    }).catch(() => null);
  }

  const res = NextResponse.json({ message: "Sesión cerrada" });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
