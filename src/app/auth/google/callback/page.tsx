import type { Metadata } from "next"
import { Suspense } from "react"
import { GoogleCallbackClient } from "./google-callback-client"

export const metadata: Metadata = {
  title: "Entrando con Google — Convites",
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">
          Completando ingreso con Google…
        </p>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  )
}
