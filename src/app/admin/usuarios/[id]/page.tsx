import type { Metadata } from "next"
import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client"

export const metadata: Metadata = {
  title: "Detalle usuario | Admin",
}

export default async function AdminUsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = Number(id)
  if (!Number.isFinite(userId) || userId < 1) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted-foreground">
        Usuario no válido.
      </div>
    )
  }
  return <AdminUserDetailClient userId={userId} />
}
