import type { Metadata } from "next"
import { Suspense } from "react"
import { RegistrarseClient } from "./registrarse-client"

export const metadata: Metadata = {
  title: "Crear cuenta — Convites",
  description:
    "Regístrate con tu nombre y correo. Te enviamos un código para verificar y aportar a tu comunidad.",
}

export default function RegistrarsePage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">
          Cargando registro…
        </p>
      }
    >
      <RegistrarseClient />
    </Suspense>
  )
}
