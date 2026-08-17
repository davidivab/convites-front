import type { Metadata } from "next"
import { AdminConvitesClient } from "./admin-convites-client"

export const metadata: Metadata = {
  title: "Auditoría de convites | Admin",
}

export default function AdminConvitesPage() {
  return <AdminConvitesClient />
}
