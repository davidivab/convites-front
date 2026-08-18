import type { Metadata } from "next"
import { Suspense } from "react"
import { PerfilClient } from "./perfil-client"

export const metadata: Metadata = {
  title: "Mi perfil — Convites",
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando tu perfil…
        </p>
      }
    >
      <PerfilClient />
    </Suspense>
  )
}
