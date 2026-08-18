import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Administración — Convites",
}

/** Hub histórico: por defecto la vista de todos los registrados. */
export default function AdminPage() {
  redirect("/admin/ciudadanos")
}
