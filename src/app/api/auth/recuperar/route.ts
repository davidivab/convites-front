import { NextResponse } from "next/server";
import { forwardToLaravel } from "@/lib/bff";

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await forwardToLaravel("/api/auth/recuperar", {
    method: "POST",
    body,
    clientRequest: request,
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
