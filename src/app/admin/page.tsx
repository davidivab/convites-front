import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Administración — Convites",
}

/** Hub: listado unificado de usuarios (F42). */
export default function AdminPage() {
  redirect("/admin/usuarios")
}
