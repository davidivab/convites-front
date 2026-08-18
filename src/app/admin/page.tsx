import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Administración — Convites",
}

/** Hub histórico: la lista de usuarios vive en /admin/usuarios. */
export default function AdminPage() {
  redirect("/admin/usuarios")
}
