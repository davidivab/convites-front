import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminUsersListClient } from "@/components/admin/admin-users-list-client"

export const metadata: Metadata = {
  title: "Moderadores | Admin",
}

export default function AdminModeradoresPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AdminUsersListClient
        title="Moderadores"
        subtitle="Cuentas con rol moderador y municipios asignados."
        activePath="/admin/moderadores"
        listMode="moderator"
      />
    </Suspense>
  )
}
