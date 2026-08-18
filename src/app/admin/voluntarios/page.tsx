import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminUsersListClient } from "@/components/admin/admin-users-list-client"

export const metadata: Metadata = {
  title: "Voluntarios | Admin",
}

export default function AdminVoluntariosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AdminUsersListClient
        title="Voluntarios"
        subtitle="Cuentas con rol voluntario y municipios asignados."
        activePath="/admin/voluntarios"
        listMode="voluntario"
      />
    </Suspense>
  )
}
