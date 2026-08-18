import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminUsersListClient } from "@/components/admin/admin-users-list-client"

export const metadata: Metadata = {
  title: "Usuarios | Admin",
}

export default function AdminUsuariosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AdminUsersListClient
        title="Usuarios registrados"
        subtitle="Todas las cuentas y su función en la plataforma (roles)."
        activePath="/admin/usuarios"
        listMode="all"
      />
    </Suspense>
  )
}
