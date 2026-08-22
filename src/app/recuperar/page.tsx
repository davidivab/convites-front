import type { Metadata } from "next"
import { Suspense } from "react"
import { RecuperarClient } from "./recuperar-client"

export const metadata: Metadata = {
  title: "He olvidado mi contraseña — Convites",
  description: "Recibe un código en tu correo para entrar a Convites.",
}

export default function RecuperarPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </p>
      }
    >
      <RecuperarClient />
    </Suspense>
  )
}
