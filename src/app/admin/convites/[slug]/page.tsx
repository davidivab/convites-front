import type { Metadata } from "next"
import { AdminConviteDetalleClient } from "./admin-convite-detalle-client"

export const metadata: Metadata = {
  title: "Detalle convite | Admin",
}

export default function AdminConviteDetallePage() {
  return <AdminConviteDetalleClient />
}
