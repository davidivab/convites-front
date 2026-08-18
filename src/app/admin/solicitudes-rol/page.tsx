import type { Metadata } from "next"
import { AdminSolicitudesRolClient } from "./admin-solicitudes-rol-client"

export const metadata: Metadata = {
  title: "Solicitudes de rol — Admin Convites",
}

export default function Page() {
  return <AdminSolicitudesRolClient />
}
