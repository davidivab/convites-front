import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminEstadisticasClient } from "./admin-estadisticas-client"

export const metadata: Metadata = {
  title: "Estadísticas | Admin",
}

export default function AdminEstadisticasPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AdminEstadisticasClient />
    </Suspense>
  )
}
