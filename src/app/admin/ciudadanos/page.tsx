import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminUsersListClient } from "@/components/admin/admin-users-list-client"

export const metadata: Metadata = {
  title: "Ciudadanos | Admin",
}

export default function AdminCiudadanosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AdminUsersListClient
        title="Ciudadanos registrados"
        subtitle="Todas las cuentas de la plataforma, incluidas las que aún no tienen rol especial."
        activePath="/admin/ciudadanos"
        listMode="todos"
      />
    </Suspense>
  )
}
